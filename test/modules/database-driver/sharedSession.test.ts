import { describe, expect, test } from 'vitest'
import { Code, ConnectError } from '@connectrpc/connect'
import { EvitaClient } from '../../../src/modules/database-driver/EvitaClient'
import { EvitaClientSession } from '../../../src/modules/database-driver/EvitaClientSession'
import { EvitaSchemaCache } from '../../../src/modules/database-driver/EvitaSchemaCache'
import { CatalogState } from '../../../src/modules/database-driver/request-response/CatalogState'

/**
 * Shared-session lifecycle of {@link EvitaClient}: eviction, draining, and the recovery of logic whose
 * session was closed underneath it. Fully deterministic - the only networking these paths do is session
 * creation and closing, and both are stubbed.
 */

const catalogName: string = 'testCatalog'

/** Describes a single `executeInSharedSession` call; mirrors the client's internal `SharedSessionExecution`. */
interface Execution {
    catalogName: string
    readWrite: boolean
    warmup: boolean
    forceNewSession: boolean
    mutating: boolean
}

/** Private members of the client the tests drive directly. */
interface ClientInternals {
    createSession: (catalogName: string, readWrite: boolean) => Promise<EvitaClientSession>
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
    for (let i = 0; i < 10; i++) {
        await Promise.resolve()
    }
}

class TestClient {
    readonly client: EvitaClient
    /** ordered log of `create:<id>` / `close:<id>` events */
    readonly events: string[] = []
    readonly createdSessions: EvitaClientSession[] = []
    /** when set, the Close call of every session waits for this promise */
    closeGate: Promise<void> | undefined = undefined

    private sessionCounter: number = 0

    constructor() {
        this.client = new EvitaClient(
            {} as never,
            { getConnection: () => ({ name: 'test', grpcUrl: 'http://localhost:1' }) } as never
        )
        this.internals.createSession = async (catalog: string, readWrite: boolean) =>
            await this.createTestSession(catalog, readWrite)
    }

    get internals(): ClientInternals {
        return this.client as unknown as ClientInternals
    }

    get sharedSession(): EvitaClientSession | undefined {
        return this.internals.sharedSessions.get(catalogName)
    }

    /** Makes `queryCatalog`/`updateCatalog` usable without a server by faking the catalog state lookup. */
    stubCatalogState(warmup: boolean): void {
        const management = { getCatalogStatisticsForCatalog: async () => ({ isInWarmup: warmup }) }
        Object.defineProperty(this.client, 'management', { get: () => management })
    }

    requireSharedSession(): EvitaClientSession {
        const sharedSession: EvitaClientSession | undefined = this.sharedSession
        if (sharedSession == undefined) {
            throw new Error('No shared session available.')
        }
        return sharedSession
    }

    get closedSessionIds(): string[] {
        return this.events.filter(event => event.startsWith('close:')).map(event => event.substring(6))
    }

    execute<T>(
        logic: (session: EvitaClientSession) => Promise<T>,
        execution: Partial<Execution> = {}
    ): Promise<T> {
        return this.internals.executeInSharedSession<T>(
            {
                catalogName,
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

    private async createTestSession(catalog: string, _readWrite: boolean): Promise<EvitaClientSession> {
        const id: string = `S${++this.sessionCounter}`
        const sessionClient = {
            close: async () => {
                if (this.closeGate != undefined) {
                    await this.closeGate
                }
                this.events.push(`close:${id}`)
                return {}
            }
        }
        // mimic the real `createSession`, which registers the catalog's schema cache as a side effect
        const schemaCache: EvitaSchemaCache = this.internals.getOrCreateSchemaCache(catalog)
        const sessionConstructor = EvitaClientSession as unknown as new (...args: unknown[]) => EvitaClientSession
        const session: EvitaClientSession = new sessionConstructor(
            id,
            catalog,
            CatalogState.Alive,
            this.client,
            schemaCache,
            () => ({ transformError: (e: unknown) => e }),
            () => sessionClient,
            () => undefined,
            () => undefined,
            () => undefined,
            () => undefined,
            () => undefined,
            () => undefined,
            () => undefined
        )
        this.events.push(`create:${id}`)
        this.createdSessions.push(session)
        return session
    }
}

function sessionTerminatedError(): ConnectError {
    return new ConnectError(
        'Evita session has been already terminated! No calls are accepted since all resources has been released.',
        Code.InvalidArgument
    )
}

describe('shared session recovery (L1)', () => {
    test('replays logic whose session we evicted underneath it', async () => {
        const harness: TestClient = new TestClient()
        // warm up the shared session
        await harness.execute(async () => 'warmup')
        const originalSession: EvitaClientSession = harness.requireSharedSession()

        const gate: Deferred<void> = deferred<void>()
        const usedSessionIds: string[] = []
        const callerA: Promise<string> = harness.execute(async (session) => {
            usedSessionIds.push(session.id)
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
        expect(usedSessionIds).toEqual([originalSession.id, harness.sharedSession!.id])
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
        expect(harness.createdSessions).toHaveLength(2)
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
})

describe('shared session eviction (L2)', () => {
    test('never removes a session installed by a concurrent creation', async () => {
        const harness: TestClient = new TestClient()
        await harness.execute(async () => 'warmup')
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
        await harness.execute(async () => 'warmup')
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
        const warmup: Partial<Execution> = { readWrite: true, warmup: true }
        await harness.execute(async () => 'warmup', warmup)
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

        const callerB: Promise<EvitaClientSession> = harness.execute(async (session) => session, warmup)
        await settle()

        // evitaDB permits a single session on a warming up catalog, so B must wait for the old one to close
        expect(harness.createdSessions).toHaveLength(1)

        gate.resolve()
        await expect(callerA).resolves.toBe('A')
        const sessionOfB: EvitaClientSession = await callerB

        expect(sessionOfB).not.toBe(originalSession)
        expect(harness.events).toEqual([
            `create:${originalSession.id}`,
            `close:${originalSession.id}`,
            `create:${sessionOfB.id}`
        ])
    })
})
