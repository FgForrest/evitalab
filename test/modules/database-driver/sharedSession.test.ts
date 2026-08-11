import 'fake-indexeddb/auto'
import { describe, expect, test } from 'vitest'
import { Code, ConnectError } from '@connectrpc/connect'
import { EvitaClient } from '../../../src/modules/database-driver/EvitaClient'
import { LabServerDataCache } from '../../../src/modules/storage/LabServerDataCache'
import { EvitaClientSession } from '../../../src/modules/database-driver/EvitaClientSession'
import { EvitaSchemaCache } from '../../../src/modules/database-driver/EvitaSchemaCache'
import { CatalogState } from '../../../src/modules/database-driver/request-response/CatalogState'
import { GrpcCatalogState } from '../../../src/modules/database-driver/connector/grpc/gen/GrpcEnums_pb'
import type { CatalogSchema } from '../../../src/modules/database-driver/request-response/schema/CatalogSchema'
import type { EntitySchema } from '../../../src/modules/database-driver/request-response/schema/EntitySchema'

/**
 * Shared-session lifecycle of {@link EvitaClient}: lazy materialization of the server-side session,
 * eviction, draining, and the recovery of logic whose session was closed underneath it.
 *
 * Fully deterministic: the gRPC service clients are replaced with fakes, so "the server" is a scripted
 * object that records every call. Session creation and closing are therefore observable as events, which is
 * what lets these tests distinguish a local session shell from a real server session.
 */

const catalogName: string = 'testCatalog'

/** Describes a single `executeInSharedSession` call; mirrors the client's internal `SharedSessionExecution`. */
interface Execution {
    catalogName: string
    catalogState: CatalogState
    readWrite: boolean
    warmup: boolean
    forceNewSession: boolean
    mutating: boolean
}

/** Private members of the client the tests drive directly. */
interface ClientInternals {
    createSession: (
        catalogName: string,
        catalogState: CatalogState,
        readWrite: boolean,
        warmup: boolean
    ) => EvitaClientSession
    getOrCreateSchemaCache: (catalogName: string) => EvitaSchemaCache
    executeInSharedSession: <T>(
        execution: Execution,
        logic: (session: EvitaClientSession) => Promise<T>,
        retryOnSessionClosed: boolean
    ) => Promise<T>
    sharedSessions: Map<string, EvitaClientSession>
}

interface Deferred<T> {
    promise: Promise<T>
    resolve: (value: T) => void
}

function deferred<T>(): Deferred<T> {
    let resolve: (value: T) => void = () => { /* replaced synchronously below */ }
    const promise: Promise<T> = new Promise<T>(r => { resolve = r })
    return { promise, resolve }
}

/** Lets all already-scheduled microtasks run. */
async function settle(): Promise<void> {
    for (let i = 0; i < 20; i++) {
        await Promise.resolve()
    }
}

class TestClient {
    readonly client: EvitaClient
    /** ordered log of server-observable events: `create:<id>`, `createFailed`, `close:<id>` */
    readonly events: string[] = []
    /** session shells the client handed out, in creation order */
    readonly shells: EvitaClientSession[] = []
    /** `readWrite` flag of every server-side session creation, in order */
    readonly createdSessionModes: boolean[] = []
    /** when set, every server-side session creation waits for this promise */
    createGate: Promise<void> | undefined = undefined
    /** when set, the Close call of every session waits for this promise */
    closeGate: Promise<void> | undefined = undefined
    /** when true, every server-side session creation fails as if the server were unreachable */
    serverUnreachable: boolean = false

    private sessionCounter: number = 0

    constructor() {
        this.client = new EvitaClient(
            {} as never,
            { getConnection: () => ({ name: 'test', grpcUrl: 'http://localhost:1' }) } as never,
            // a per-instance database name keeps these tests off each other's persisted records, and off those
            // of every other test file
            new LabServerDataCache(`http://localhost:5555/sharedSession/${Math.random()}`)
        )
        Object.defineProperty(this.client, 'evitaClient', { get: () => this.evitaServiceClient })
        Object.defineProperty(this.client, 'evitaSessionClient', { get: () => this.sessionServiceClient })

        // record every shell the client builds, without changing how it builds them
        const createSession = this.internals.createSession.bind(this.client)
        this.internals.createSession = (
            catalog: string,
            catalogState: CatalogState,
            readWrite: boolean,
            warmup: boolean
        ) => {
            const shell: EvitaClientSession = createSession(catalog, catalogState, readWrite, warmup)
            this.shells.push(shell)
            return shell
        }
    }

    get internals(): ClientInternals {
        return this.client as unknown as ClientInternals
    }

    get sharedSession(): EvitaClientSession | undefined {
        return this.internals.sharedSessions.get(catalogName)
    }

    /** Ids of the sessions that really exist (or existed) on the server, in creation order. */
    get createdSessionIds(): string[] {
        return this.events.filter(event => event.startsWith('create:')).map(event => event.substring(7))
    }

    get closedSessionIds(): string[] {
        return this.events.filter(event => event.startsWith('close:')).map(event => event.substring(6))
    }

    /** Makes `queryCatalog`/`updateCatalog` usable without a server by faking the catalog state lookup. */
    stubCatalogState(warmup: boolean): void {
        const management = {
            getCatalogStatisticsForCatalog: async () => ({
                isInWarmup: warmup,
                catalogState: warmup ? CatalogState.WarmingUp : CatalogState.Alive
            })
        }
        Object.defineProperty(this.client, 'management', { get: () => management })
    }

    requireSharedSession(): EvitaClientSession {
        const sharedSession: EvitaClientSession | undefined = this.sharedSession
        if (sharedSession == undefined) {
            throw new Error('No shared session available.')
        }
        return sharedSession
    }

    schemaCache(): EvitaSchemaCache {
        return this.internals.getOrCreateSchemaCache(catalogName)
    }

    execute<T>(
        logic: (session: EvitaClientSession) => Promise<T>,
        execution: Partial<Execution> = {}
    ): Promise<T> {
        return this.internals.executeInSharedSession<T>(
            {
                catalogName,
                catalogState: CatalogState.Alive,
                readWrite: false,
                warmup: false,
                forceNewSession: false,
                mutating: false,
                ...execution
            },
            logic,
            true
        )
    }

    private get evitaServiceClient() {
        return {
            createReadOnlySession: async () => await this.createServerSession(false),
            createReadWriteSession: async () => await this.createServerSession(true)
        }
    }

    private get sessionServiceClient() {
        return {
            close: async (_request: unknown, metadata: { headers: Record<string, string> }) => {
                if (this.closeGate != undefined) {
                    await this.closeGate
                }
                this.events.push(`close:${metadata.headers.sessionId}`)
                return {}
            },
            getAllEntityTypes: async () => ({ entityTypes: ['Product'] }),
            getCatalogSchema: async () => ({ catalogSchema: {} }),
            getEntitySchema: async () => ({ entitySchema: undefined })
        }
    }

    private async createServerSession(readWrite: boolean): Promise<{ sessionId: string, catalogState: GrpcCatalogState }> {
        if (this.createGate != undefined) {
            await this.createGate
        }
        if (this.serverUnreachable) {
            this.events.push('createFailed')
            throw new ConnectError('Server unreachable.', Code.Unavailable)
        }
        const sessionId: string = `S${++this.sessionCounter}`
        this.events.push(`create:${sessionId}`)
        this.createdSessionModes.push(readWrite)
        return { sessionId, catalogState: GrpcCatalogState.ALIVE }
    }
}

function sessionTerminatedError(): ConnectError {
    return new ConnectError(
        'Evita session has been already terminated! No calls are accepted since all resources has been released.',
        Code.InvalidArgument
    )
}

/** A schema stand-in — the caches only store and hand back whatever they were given. */
function fakeEntitySchema(entityType: string, version: number = 1): EntitySchema {
    return { name: entityType, version } as unknown as EntitySchema
}

function fakeCatalogSchema(version: number = 1): CatalogSchema {
    return { name: catalogName, version } as unknown as CatalogSchema
}

describe('lazy session materialization (W2)', () => {
    test('creates a session shell without opening a session on the server', async () => {
        const harness: TestClient = new TestClient()

        const session: EvitaClientSession = await harness.execute(async (it) => it)

        expect(harness.sharedSession).toBe(session)
        expect(session.isActive).toBe(true)
        expect(session.isMaterialized).toBe(false)
        expect(session.id).toBeUndefined()
        // the whole point of the shell: a caller that needs nothing from the server costs nothing on it
        expect(harness.events).toEqual([])
    })

    test('serves cached schemas without opening a session on the server', async () => {
        const harness: TestClient = new TestClient()
        const schemaCache: EvitaSchemaCache = harness.schemaCache()
        // prime the client-side cache, as a previous run (or the persistent cache) would have
        await schemaCache.getLatestCatalogSchema(async () => fakeCatalogSchema())
        schemaCache.setLatestEntitySchema(fakeEntitySchema('Product'))

        const [catalogSchema, entitySchema] = await harness.execute(async (session) => [
            await session.getCatalogSchema(),
            await session.getEntitySchema('Product')
        ])

        expect(catalogSchema.version).toBe(1)
        expect(entitySchema?.name).toBe('Product')
        expect(harness.requireSharedSession().isMaterialized).toBe(false)
        expect(harness.events).toEqual([])
    })

    test('materializes exactly once for concurrent calls that need the server', async () => {
        const harness: TestClient = new TestClient()
        const createGate: Deferred<void> = deferred<void>()
        harness.createGate = createGate.promise

        const results: Promise<unknown[]> = harness.execute(async (session) => await Promise.all([
            session.getAllEntityTypes(),
            session.getAllEntityTypes(),
            session.getAllEntityTypes()
        ]))
        await settle()

        // all three calls are parked on the very same creation
        expect(harness.createdSessionIds).toEqual([])
        createGate.resolve()
        await results

        expect(harness.createdSessionIds).toEqual(['S1'])
        expect(harness.requireSharedSession().id).toBe('S1')
    })

    test('retries materialization after a failed attempt', async () => {
        const harness: TestClient = new TestClient()
        harness.serverUnreachable = true

        const session: EvitaClientSession = await harness.execute(async (it) => it)

        // every concurrent caller of the failed attempt observes its failure
        const failures: PromiseSettledResult<unknown>[] = await Promise.allSettled([
            session.getAllEntityTypes(),
            session.getAllEntityTypes()
        ])
        expect(failures.map(it => it.status)).toEqual(['rejected', 'rejected'])
        expect(harness.events).toEqual(['createFailed'])

        // the server recovers; the very same shell must be able to open a session now
        harness.serverUnreachable = false
        await session.getAllEntityTypes()

        expect(harness.createdSessionIds).toEqual(['S1'])
        expect(session.isMaterialized).toBe(true)
    })

    test('closes a never-materialized shell locally', async () => {
        const harness: TestClient = new TestClient()
        const session: EvitaClientSession = await harness.execute(async (it) => it)

        await session.closeWhenIdle()

        expect(session.isActive).toBe(false)
        // there is no server-side session to close, so no Close call may be sent
        expect(harness.events).toEqual([])
    })

    test('closes a session that was created while the close was already in flight', async () => {
        const harness: TestClient = new TestClient()
        const createGate: Deferred<void> = deferred<void>()
        harness.createGate = createGate.promise
        const session: EvitaClientSession = await harness.execute(async (it) => it)

        const call: Promise<unknown> = session.getAllEntityTypes()
        await settle()
        const closing: Promise<void> = session.close()
        await settle()

        createGate.resolve()
        await call
        await closing

        // the session must not be leaked just because it appeared after the close was requested
        expect(harness.events).toEqual(['create:S1', 'close:S1'])
    })

    test('refuses to materialize a shell that has been closed underneath its caller', async () => {
        const harness: TestClient = new TestClient()
        const session: EvitaClientSession = await harness.execute(async (it) => it)

        await session.closeWhenIdle()
        await expect(session.getAllEntityTypes()).rejects.toThrow(/is not active/)

        // opening a session nobody can close any more would leak it on the server
        expect(harness.events).toEqual([])
    })

    test('keeps serving cached schemas from a shell whose materialization keeps failing', async () => {
        const harness: TestClient = new TestClient()
        harness.schemaCache().setLatestEntitySchema(fakeEntitySchema('Product'))
        harness.serverUnreachable = true

        const entitySchema: EntitySchema | undefined = await harness.execute(
            async (session) => await session.getEntitySchema('Product')
        )

        expect(entitySchema?.name).toBe('Product')
        // only the genuinely network-bound call fails
        await expect(harness.requireSharedSession().getAllEntityTypes()).rejects.toThrow()
        expect(harness.createdSessionIds).toEqual([])
    })
})

describe('shared session recovery (L1)', () => {
    test('replays logic whose session we evicted underneath it', async () => {
        const harness: TestClient = new TestClient()
        // warm up the shared session
        await harness.execute(async () => 'warmup')
        const originalSession: EvitaClientSession = harness.requireSharedSession()

        const gate: Deferred<void> = deferred<void>()
        const usedSessionIds: string[] = []
        const callerA: Promise<string> = harness.execute(async (session) => {
            usedSessionIds.push(session.debugId)
            if (usedSessionIds.length === 1) {
                await gate.promise
                // the server answers a call on a terminated session with an invalid-usage error,
                // indistinguishable from a malformed query
                throw sessionTerminatedError()
            }
            return 'A'
        })
        await settle()

        // another caller wants fresh data, which replaces the shared session A is executing on
        await harness.execute(async () => 'B', { forceNewSession: true })
        expect(harness.sharedSession).not.toBe(originalSession)

        gate.resolve()

        await expect(callerA).resolves.toBe('A')
        expect(usedSessionIds).toEqual([originalSession.debugId, harness.sharedSession!.debugId])
    })

    test('does not replay logic that failed on a live shared session', async () => {
        const harness: TestClient = new TestClient()
        let invocations: number = 0
        const error: ConnectError = new ConnectError('Malformed query.', Code.InvalidArgument)

        await expect(harness.execute(async () => {
            invocations++
            throw error
        })).rejects.toBe(error)

        expect(invocations).toBe(1)
    })

    test('still recovers from a session the server dropped on its own', async () => {
        const harness: TestClient = new TestClient()
        let invocations: number = 0

        const result: string = await harness.execute(async () => {
            invocations++
            if (invocations === 1) {
                throw new ConnectError('sessionNotFound', Code.Unauthenticated)
            }
            return 'recovered'
        })

        expect(result).toBe('recovered')
        expect(invocations).toBe(2)
        expect(harness.shells).toHaveLength(2)
    })

    test('reports the original failure when even the retry fails', async () => {
        const harness: TestClient = new TestClient()

        const failure: Promise<unknown> = harness.execute(async () => {
            throw new ConnectError('sessionNotFound', Code.Unauthenticated)
        })

        await expect(failure).rejects.toThrow(/sessionNotFound/)
    })

    test('keeps the original failure readable through the public API', async () => {
        const harness: TestClient = new TestClient()
        // `queryCatalog` funnels everything through `ErrorTransformer`, which flattens non-transport
        // errors into `UnexpectedError` - only the message survives that
        harness.stubCatalogState(false)

        const failure: Promise<unknown> = harness.client.queryCatalog(catalogName, async () => {
            throw new ConnectError('sessionNotFound', Code.Unauthenticated)
        })

        await expect(failure).rejects.toThrow(/sessionNotFound/)
    })

    test('replaces a materialized session the server dropped while it is unreachable, without losing cached reads', async () => {
        const harness: TestClient = new TestClient()
        harness.schemaCache().setLatestEntitySchema(fakeEntitySchema('Product'))
        // the shared session really exists on the server
        await harness.execute(async (session) => await session.getAllEntityTypes())
        expect(harness.createdSessionIds).toEqual(['S1'])

        // the server becomes unreachable and drops the session
        harness.serverUnreachable = true
        await expect(harness.execute(async (session) => {
            await session.getAllEntityTypes()
            throw new ConnectError('sessionNotFound', Code.Unauthenticated)
        })).rejects.toThrow()

        // the replacement shell serves cached data, and only network calls fail
        const entitySchema: EntitySchema | undefined = await harness.execute(
            async (session) => await session.getEntitySchema('Product')
        )
        expect(entitySchema?.name).toBe('Product')

        // no stuck state: once the server recovers, the shell materializes on the next call
        harness.serverUnreachable = false
        await harness.execute(async (session) => await session.getAllEntityTypes())
        expect(harness.createdSessionIds).toEqual(['S1', 'S2'])
    })
})

describe('shared session eviction (L2)', () => {
    test('never removes a session installed by a concurrent creation', async () => {
        const harness: TestClient = new TestClient()
        await harness.execute(async (session) => await session.getAllEntityTypes())
        const originalSession: EvitaClientSession = harness.requireSharedSession()

        // park the Close call so a creation can race with it
        const closeGate: Deferred<void> = deferred<void>()
        harness.closeGate = closeGate.promise

        await harness.client.terminateSharedSession(catalogName)
        expect(harness.sharedSession).toBeUndefined()

        // a new caller misses the cache and installs a fresh shared session while the old one is closing
        await harness.execute(async () => 'fresh')
        const freshSession: EvitaClientSession | undefined = harness.sharedSession
        expect(freshSession).not.toBe(originalSession)

        closeGate.resolve()
        await settle()

        // the fresh session must still be reachable, otherwise it is leaked (open on the server, unclosable)
        expect(harness.sharedSession).toBe(freshSession)
        expect(harness.closedSessionIds).toEqual([originalSession.id])
    })
})

describe('shared session draining (L3)', () => {
    test('does not terminate a call that is already executing', async () => {
        const harness: TestClient = new TestClient()
        await harness.execute(async (session) => await session.getAllEntityTypes())
        const originalSession: EvitaClientSession = harness.requireSharedSession()

        const gate: Deferred<void> = deferred<void>()
        const callerA: Promise<string> = harness.execute(async () => {
            await gate.promise
            return 'A'
        })
        await settle()

        await harness.execute(async () => 'B', { forceNewSession: true })
        const newSession: EvitaClientSession | undefined = harness.sharedSession

        // 1) the suspended caller keeps a usable session
        expect(originalSession.isActive).toBe(true)
        expect(harness.closedSessionIds).toEqual([])

        // 2) every other caller does get the new shared session, not the draining one
        const sessionOfLaterCaller: EvitaClientSession = await harness.execute(async (session) => session)
        expect(sessionOfLaterCaller).toBe(newSession)
        expect(sessionOfLaterCaller).not.toBe(originalSession)

        // 3) the old session is closed exactly once, only after its last caller is done
        gate.resolve()
        await expect(callerA).resolves.toBe('A')
        await settle()
        expect(originalSession.isActive).toBe(false)
        expect(harness.closedSessionIds).toEqual([originalSession.id])
    })

    test('opens no second session on a warming up catalog before the old one is closed', async () => {
        const harness: TestClient = new TestClient()
        const warmup: Partial<Execution> = {
            catalogState: CatalogState.WarmingUp,
            readWrite: true,
            warmup: true
        }
        await harness.execute(async (session) => await session.getAllEntityTypes(), warmup)
        const originalSession: EvitaClientSession = harness.requireSharedSession()

        const gate: Deferred<void> = deferred<void>()
        const callerA: Promise<string> = harness.execute(async () => {
            await gate.promise
            return 'A'
        }, warmup)
        await settle()

        // a schema change invalidates the caches and with them the shared session
        await harness.client.clearSchemaCache(catalogName)
        expect(harness.sharedSession).toBeUndefined()

        const callerB: Promise<EvitaClientSession> = harness.execute(
            async (session) => {
                await session.getAllEntityTypes()
                return session
            },
            warmup
        )
        await settle()

        // evitaDB permits a single session on a warming up catalog, so B's session must wait for the old
        // one to close - the shell exists immediately, the server session does not
        expect(harness.createdSessionIds).toEqual([originalSession.id])

        gate.resolve()
        await expect(callerA).resolves.toBe('A')
        const sessionOfB: EvitaClientSession = await callerB

        expect(sessionOfB).not.toBe(originalSession)
        expect(harness.events).toEqual([
            `create:${originalSession.id}`,
            `close:${originalSession.id}`,
            `create:${sessionOfB.id}`
        ])
        // a shared session of a warming up catalog is always read-write
        expect(harness.createdSessionModes).toEqual([true, true])
    })
})
