import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { create } from '@bufbuild/protobuf'
import { buildSchema, introspectionFromSchema, type IntrospectionQuery } from 'graphql'
import { List as ImmutableList } from 'immutable'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { LabServerDataCache } from '@/modules/storage/LabServerDataCache'
import { CacheInvalidationReason } from '@/modules/database-driver/cache/CacheInvalidationReason'
import { DataFreshness } from '@/modules/database-driver/model/DataFreshness'
import {
    markServerReachable,
    markServerUnreachable,
    resetServerConnectivity
} from '@/modules/database-driver/model/serverConnectivity'
import { GrpcCatalogState } from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb'
import {
    type GrpcCatalogSchema,
    GrpcCatalogSchemaSchema
} from '@/modules/database-driver/connector/grpc/gen/GrpcCatalogSchema_pb'
import {
    type GrpcEntitySchema,
    GrpcEntitySchemaSchema
} from '@/modules/database-driver/connector/grpc/gen/GrpcEntitySchema_pb'
import {
    type GrpcCatalogStatistics,
    GrpcCatalogStatisticsSchema
} from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaDataTypes_pb'
import type { CatalogSchema } from '@/modules/database-driver/request-response/schema/CatalogSchema'
import type { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import type { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import { CatalogState } from '@/modules/database-driver/request-response/CatalogState'
import { GraphQLInstanceType } from '@/modules/graphql-console/console/model/GraphQLInstanceType'

/**
 * The persistent (on-disk) second level of the client caches, exercised end-to-end: real protobuf payloads,
 * real converters, real IndexedDB (faked at the storage layer only).
 *
 * "Restarting evitaLab" is modelled by building a **second** {@link EvitaClient} over a fresh
 * {@link LabServerDataCache} of the same connection: same database, empty memory — exactly the state a browser
 * reload leaves behind.
 */

const catalogName: string = 'testCatalog'
const entityType: string = 'Product'

/** Distinct provider name per test, so tests cannot inherit each other's database. */
let providerName: string

interface ServerScript {
    /** version the server reports for the catalog schema */
    catalogSchemaVersion: number
    /** version the server reports for the entity schema */
    entitySchemaVersion: number
    /** state the server reports for the catalog in its statistics */
    catalogState: GrpcCatalogState
    /** whether the server reports the catalog as unusable — an unusable catalog cannot be opened */
    unusable: boolean
    /** when true, every call fails as if the server were unreachable */
    unreachable: boolean
}

class TestClient {
    readonly client: EvitaClient
    readonly script: ServerScript
    /** the on-disk store behind the client, so tests can observe it directly */
    readonly persistentCache: LabServerDataCache
    /** number of calls the client made per RPC */
    readonly calls: Record<string, number> = {}

    constructor(script: Partial<ServerScript> = {}) {
        this.script = {
            catalogSchemaVersion: 1,
            entitySchemaVersion: 1,
            catalogState: GrpcCatalogState.ALIVE,
            unusable: false,
            unreachable: false,
            ...script
        }
        this.persistentCache = new LabServerDataCache(providerName)
        this.client = new EvitaClient(
            {} as never,
            { getConnection: () => ({ name: 'test', grpcUrl: 'http://localhost:1' }) } as never,
            this.persistentCache
        )
        Object.defineProperty(this.client, 'evitaClient', { get: () => this.evitaServiceClient })
        Object.defineProperty(this.client, 'evitaSessionClient', { get: () => this.sessionServiceClient })
        Object.defineProperty(this.client, 'evitaManagementClient', { get: () => this.managementServiceClient })
    }

    private record(rpc: string): void {
        if (this.script.unreachable) {
            throw new Error('Server unreachable.')
        }
        this.calls[rpc] = (this.calls[rpc] ?? 0) + 1
    }

    private get evitaServiceClient() {
        return {
            createReadOnlySession: async () => {
                this.record('createSession')
                return { sessionId: 'S1', catalogState: GrpcCatalogState.ALIVE }
            },
            createReadWriteSession: async () => {
                this.record('createSession')
                return { sessionId: 'S1', catalogState: GrpcCatalogState.ALIVE }
            },
            deleteCatalogIfExists: async () => {
                this.record('deleteCatalogIfExists')
                return { success: true }
            }
        }
    }

    private get sessionServiceClient() {
        return {
            close: async () => ({}),
            getCatalogSchema: async () => {
                this.record('getCatalogSchema')
                return { catalogSchema: grpcCatalogSchema(this.script.catalogSchemaVersion) }
            },
            getEntitySchema: async () => {
                this.record('getEntitySchema')
                return { entitySchema: grpcEntitySchema(this.script.entitySchemaVersion) }
            }
        }
    }

    private get managementServiceClient() {
        return {
            getCatalogStatistics: async () => {
                this.record('getCatalogStatistics')
                return { catalogStatistics: [grpcCatalogStatistics(this.script)] }
            }
        }
    }

    getCatalogSchema(): Promise<CatalogSchema> {
        return this.client.queryCatalog(catalogName, async (session) => await session.getCatalogSchema())
    }

    getEntitySchema(): Promise<EntitySchema | undefined> {
        return this.client.queryCatalog(catalogName, async (session) => await session.getEntitySchema(entityType))
    }

    /** What the stubbed introspection HTTP call currently answers with. */
    private graphQLIntrospection?: IntrospectionQuery

    /**
     * Answers the GraphQL introspection HTTP call with the given result, bypassing ky entirely. Calling it
     * again re-scripts the server, which is how a schema changing behind evitaLab's back is modelled.
     */
    stubGraphQLIntrospection(introspection: IntrospectionQuery): void {
        if (this.graphQLIntrospection == undefined) {
            Object.defineProperty(this.client, 'httpApiClient', {
                value: {
                    post: () => {
                        this.record('graphQLIntrospection')
                        return { json: async () => ({ data: this.graphQLIntrospection }) }
                    }
                }
            })
        }
        this.graphQLIntrospection = introspection
    }
}

function grpcCatalogSchema(version: number): GrpcCatalogSchema {
    return create(GrpcCatalogSchemaSchema, {
        name: catalogName,
        version,
        description: `catalog schema v${version}`
    })
}

function grpcEntitySchema(version: number): GrpcEntitySchema {
    return create(GrpcEntitySchemaSchema, {
        name: entityType,
        version,
        description: `entity schema v${version}`
    })
}

function grpcCatalogStatistics(script: ServerScript): GrpcCatalogStatistics {
    return create(GrpcCatalogStatisticsSchema, {
        catalogName,
        catalogState: script.catalogState,
        catalogVersion: '1',
        totalRecords: '10',
        indexCount: '2',
        sizeOnDiskInBytes: '1024',
        readOnly: false,
        unusable: script.unusable
    })
}

/** Lets all already-scheduled microtasks (including background revalidations) run. */
async function settle(): Promise<void> {
    for (let i = 0; i < 50; i++) {
        await Promise.resolve()
    }
}

/**
 * Lets the fire-and-forget write-throughs actually complete. IndexedDB resolves through events, not
 * microtasks, so {@link settle} cannot advance them — tests that observe a *write* have to yield macrotasks.
 * (Tests that merely read a written record do not need this: IndexedDB serializes operations per store, so a
 * read issued after a put sees it.)
 */
async function flushWrites(): Promise<void> {
    for (let i = 0; i < 20; i++) {
        await new Promise<void>(resolve => setTimeout(resolve, 0))
    }
}

beforeEach(() => {
    providerName = `http://localhost:5555/${Math.random()}`
})

describe('surviving a reload', () => {
    test('serves the catalog schema from disk when the server is unreachable', async () => {
        const firstRun: TestClient = new TestClient()
        const original: CatalogSchema = await firstRun.getCatalogSchema()
        expect(original.version).toBe(1)

        // the lab is restarted and the server is down
        const secondRun: TestClient = new TestClient({ unreachable: true })
        const restored: CatalogSchema = await secondRun.getCatalogSchema()

        // hydration replays the persisted payload through the very same converter, so the schema is identical
        expect(restored.version).toBe(original.version)
        expect(restored.name).toBe(original.name)
        expect(restored.description).toBe(original.description)
    })

    test('serves an entity schema from disk when the server is unreachable', async () => {
        const firstRun: TestClient = new TestClient()
        const original: EntitySchema | undefined = await firstRun.getEntitySchema()
        expect(original?.version).toBe(1)

        const secondRun: TestClient = new TestClient({ unreachable: true })
        const restored: EntitySchema | undefined = await secondRun.getEntitySchema()

        expect(restored?.name).toBe(entityType)
        expect(restored?.version).toBe(1)
        expect(restored?.description).toBe(original?.description)
    })

    test('serves the catalog listing from disk when the server is unreachable', async () => {
        const firstRun: TestClient = new TestClient()
        expect((await firstRun.client.management.getCatalogStatistics()).size).toBe(1)

        const secondRun: TestClient = new TestClient({ unreachable: true })
        const restored: ImmutableList<CatalogStatistics> = await secondRun.client.management.getCatalogStatistics()

        // this is what lets the connection explorer render its catalog tree with no server at all
        expect(restored.size).toBe(1)
        expect(restored.first()?.name).toBe(catalogName)
        expect(restored.first()?.version).toBe(1n)
    })

    test('never opens a server session to serve a persisted schema', async () => {
        const firstRun: TestClient = new TestClient()
        await firstRun.getCatalogSchema()

        const secondRun: TestClient = new TestClient()
        await secondRun.getCatalogSchema()
        await settle()

        // the catalog listing came from disk too, so the only server traffic is the background revalidation
        expect(secondRun.calls.getCatalogSchema).toBe(1)
    })
})

describe('stale-while-revalidate', () => {
    test('serves the persisted schema first and swaps in a newer one through the change callbacks', async () => {
        const firstRun: TestClient = new TestClient()
        await firstRun.getCatalogSchema()

        // meanwhile somebody changed the catalog schema
        const secondRun: TestClient = new TestClient({ catalogSchemaVersion: 5 })
        const reloads = vi.fn(async () => {})
        secondRun.client.registerCatalogSchemaChangedCallback(catalogName, reloads)

        const servedFromDisk: CatalogSchema = await secondRun.getCatalogSchema()
        expect(servedFromDisk.version).toBe(1)

        await settle()

        // the reader is notified exactly as it would be on a server-pushed schema change, and now reads v5
        expect(reloads).toHaveBeenCalledTimes(1)
        expect((await secondRun.getCatalogSchema()).version).toBe(5)
    })

    test('stays completely silent when the persisted schema was already current', async () => {
        const firstRun: TestClient = new TestClient()
        await firstRun.getCatalogSchema()

        const secondRun: TestClient = new TestClient({ catalogSchemaVersion: 1 })
        const reloads = vi.fn(async () => {})
        secondRun.client.registerCatalogSchemaChangedCallback(catalogName, reloads)

        expect((await secondRun.getCatalogSchema()).version).toBe(1)
        await settle()

        // the common case: verified current, so no swap and no re-render churn
        expect(reloads).not.toHaveBeenCalled()
    })

    test('revalidates once no matter how often the value is read', async () => {
        const firstRun: TestClient = new TestClient()
        await firstRun.getCatalogSchema()

        const secondRun: TestClient = new TestClient()
        await secondRun.getCatalogSchema()
        await settle()
        await secondRun.getCatalogSchema()
        await secondRun.getCatalogSchema()
        await settle()

        // the in-memory cache answers the repeated reads, so they never reach the disk and cannot schedule
        // a second revalidation
        expect(secondRun.calls.getCatalogSchema).toBe(1)
    })

    test('re-verifies a value that a memory-only invalidation restored from disk', async () => {
        const firstRun: TestClient = new TestClient()
        await firstRun.getCatalogSchema()

        const secondRun: TestClient = new TestClient()
        expect((await secondRun.getCatalogSchema()).version).toBe(1)
        await settle()
        // verified as current, so neither memory nor disk changed

        // the schema changes while evitaLab is not watching (a broken change stream misses exactly this)
        secondRun.script.catalogSchemaVersion = 5

        // a memory-only invalidation keeps the persisted copy on purpose, so the read it provokes is answered
        // from disk. That answer has to be verified again - otherwise the stale copy is resurrected into memory
        // with nothing left to correct it, and only a page reload would recover
        await secondRun.client.clearCache(CacheInvalidationReason.MemoryOnly)
        await secondRun.getCatalogSchema()
        await flushWrites()

        expect((await secondRun.getCatalogSchema()).version).toBe(5)
    })

    test('corrects a catalog state restored from disk after a memory-only invalidation', async () => {
        // the listing is persisted while the catalog is mid-activation, so it is unusable and cannot be opened
        const firstRun: TestClient = new TestClient({
            catalogState: GrpcCatalogState.BEING_ACTIVATED,
            unusable: true
        })
        expect((await firstRun.client.management.getCatalogStatistics()).first()?.unusable).toBe(true)

        const secondRun: TestClient = new TestClient({
            catalogState: GrpcCatalogState.BEING_ACTIVATED,
            unusable: true
        })
        await secondRun.client.management.getCatalogStatistics()
        await settle()

        // the activation finishes while evitaLab cannot observe it
        secondRun.script.catalogState = GrpcCatalogState.ALIVE
        secondRun.script.unusable = false

        // this is what the change-stream reconnect does when its resume point keeps being rejected: drop the
        // in-memory listing but keep the persisted one, which is what an unreachable server is served from
        await secondRun.client.management.clearCatalogStatisticsCache(CacheInvalidationReason.MemoryOnly)
        await settle()

        const corrected: CatalogStatistics | undefined =
            (await secondRun.client.management.getCatalogStatistics()).first()
        expect(corrected?.catalogState).toBe(CatalogState.Alive)
        expect(corrected?.unusable).toBe(false)
    })

    test('swaps in a listing that differs only in whether the catalog can be opened', async () => {
        const client: TestClient = new TestClient({ unusable: true })
        expect((await client.client.management.getCatalogStatistics()).first()?.unusable).toBe(true)

        const reloads = vi.fn(async () => {})
        client.client.management.registerCatalogStatisticsChangeCallback(reloads)

        // same name, same version, same state - only the catalog became usable again
        client.script.unusable = false
        expect(await client.client.management.refreshCatalogStatistics()).toBe(true)

        // the explorer decides on `unusable` whether a catalog can be opened at all, so a listing that differs
        // in nothing else still has to reach it
        expect(reloads).toHaveBeenCalledTimes(1)
        expect((await client.client.management.getCatalogStatistics()).first()?.unusable).toBe(false)
    })

    test('an explicit reload re-verifies what could not be verified while the server was down', async () => {
        const firstRun: TestClient = new TestClient()
        await firstRun.getCatalogSchema()

        const secondRun: TestClient = new TestClient({ unreachable: true })
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        try {
            expect((await secondRun.getCatalogSchema()).version).toBe(1)
            await settle()
            expect(secondRun.client.dataFreshness.value).toBe(DataFreshness.Cached)

            // the server recovers and has moved on
            secondRun.script.unreachable = false
            secondRun.script.catalogSchemaVersion = 7
            // Reload must not be a no-op against a stale-data badge: the reads it triggers are answered from
            // disk, so it has to re-verify explicitly
            await secondRun.client.clearCache(CacheInvalidationReason.MemoryOnly)
            await settle()

            expect((await secondRun.getCatalogSchema()).version).toBe(7)
            expect(secondRun.client.dataFreshness.value).toBe(DataFreshness.Live)
        } finally {
            warn.mockRestore()
        }
    })

    test('keeps retrying a re-verification that fails right after the server came back', async () => {
        const firstRun: TestClient = new TestClient()
        await firstRun.getCatalogSchema()

        const secondRun: TestClient = new TestClient({ unreachable: true })
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        // only setTimeout is faked: fake-indexeddb schedules its own work through the other timer APIs and
        // stops responding if those are frozen
        vi.useFakeTimers({ toFake: ['setTimeout'] })
        try {
            await secondRun.getCatalogSchema()
            await settle()
            expect(secondRun.client.dataFreshness.value).toBe(DataFreshness.Cached)

            // the server answers again, so the recovery fires — but it is not yet able to serve catalog work,
            // which is exactly what made recovery flaky: one failed attempt used to leave the badge stuck for
            // good, because an idle tab never re-reads those keys
            markServerUnreachable()
            markServerReachable()
            await settle()
            expect(secondRun.client.dataFreshness.value).toBe(DataFreshness.Cached)

            // now it is ready
            secondRun.script.unreachable = false
            await vi.advanceTimersByTimeAsync(3_000)
            await settle()

            expect(secondRun.client.dataFreshness.value).toBe(DataFreshness.Live)
        } finally {
            vi.useRealTimers()
            resetServerConnectivity()
            warn.mockRestore()
        }
    })

    test('re-verifies as soon as the server is reachable again, without waiting for anything else', async () => {
        const firstRun: TestClient = new TestClient()
        await firstRun.getCatalogSchema()

        const secondRun: TestClient = new TestClient({ unreachable: true })
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        try {
            await secondRun.getCatalogSchema()
            await settle()
            expect(secondRun.client.dataFreshness.value).toBe(DataFreshness.Cached)

            // the driver's own funnels observe the server going away and coming back; nothing reads anything in
            // between, and the badge must still clear — it used to wait for the change-stream reconnect, whose
            // backoff grows to a minute
            markServerUnreachable()
            secondRun.script.unreachable = false
            secondRun.script.catalogSchemaVersion = 9
            markServerReachable()
            await settle()

            expect(secondRun.client.dataFreshness.value).toBe(DataFreshness.Live)
            expect((await secondRun.getCatalogSchema()).version).toBe(9)
        } finally {
            resetServerConnectivity()
            warn.mockRestore()
        }
    })
})

describe('invalidation intent', () => {
    test('a wholesale memory-only clear keeps the persisted copy', async () => {
        const client: TestClient = new TestClient()
        await client.getCatalogSchema()

        await client.client.clearCache(CacheInvalidationReason.MemoryOnly)
        // the server goes away right after the reconnect-driven clear
        client.script.unreachable = true

        // this is the whole point of the distinction: a reachability-driven clear must not eat the offline copy
        expect((await client.getCatalogSchema()).version).toBe(1)
    })

    test('a change-evidence schema invalidation drops the persisted copy', async () => {
        const client: TestClient = new TestClient()
        await client.getCatalogSchema()

        await client.client.clearSchemaCache(catalogName)
        client.script.unreachable = true

        // the data provably changed, so serving the old copy would be wrong - the read has to fail instead
        await expect(client.getCatalogSchema()).rejects.toThrow()
    })

    test('a change-evidence entity schema invalidation drops only that entity type', async () => {
        const client: TestClient = new TestClient()
        await client.getCatalogSchema()
        await client.getEntitySchema()

        await client.client.clearSchemaCache(catalogName, entityType)
        client.script.unreachable = true

        expect((await client.getCatalogSchema()).version).toBe(1)
        await expect(client.getEntitySchema()).rejects.toThrow()
    })

    test('a wholesale change-evidence clear drops the persisted copies', async () => {
        const client: TestClient = new TestClient()
        await client.getCatalogSchema()

        // what the explorer does after a mutation of its own: the data is known to be outdated
        await client.client.clearCache(CacheInvalidationReason.ChangeEvidence)
        client.script.unreachable = true

        await expect(client.getCatalogSchema()).rejects.toThrow()
    })

    test('a wholesale change-evidence clear also drops schemas of catalogs it has never read', async () => {
        const firstRun: TestClient = new TestClient()
        await firstRun.getCatalogSchema()
        await firstRun.getEntitySchema()
        await flushWrites()

        // a catalog mutated right after a reload: nothing of it is in memory, so a clear that only walks the
        // in-memory caches leaves the provably outdated records on disk for the next read to serve
        const secondRun: TestClient = new TestClient()
        await secondRun.client.clearCache(CacheInvalidationReason.ChangeEvidence)
        secondRun.script.unreachable = true

        await expect(secondRun.getCatalogSchema()).rejects.toThrow()
        await expect(secondRun.getEntitySchema()).rejects.toThrow()
    })

    test('deleting a catalog removes its persisted records', async () => {
        const client: TestClient = new TestClient()
        await client.getCatalogSchema()
        await client.getEntitySchema()

        // this path discards the whole per-catalog cache object rather than invalidating it through the cache,
        // so without explicit disk cleanup the records of a deleted catalog would outlive it
        expect(await client.client.deleteCatalogIfExists(catalogName)).toBe(true)
        client.script.unreachable = true

        await expect(client.getCatalogSchema()).rejects.toThrow()
        await expect(client.getEntitySchema()).rejects.toThrow()
    })
})

describe('manual refresh', () => {
    test('an offline refresh keeps memory and disk intact and reports the failure', async () => {
        const client: TestClient = new TestClient()
        await client.getCatalogSchema()
        const reloads = vi.fn(async () => {})
        client.client.registerCatalogSchemaChangedCallback(catalogName, reloads)

        client.script.unreachable = true
        await expect(client.client.refreshCatalogSchema(catalogName)).rejects.toThrow()

        // a user action that cannot succeed must not eat the data it targets
        expect(reloads).not.toHaveBeenCalled()
        expect((await client.getCatalogSchema()).version).toBe(1)
        // and the disk copy is still there for the next restart
        const afterRestart: TestClient = new TestClient({ unreachable: true })
        expect((await afterRestart.getCatalogSchema()).version).toBe(1)
    })

    test('a successful refresh swaps and notifies only when the schema really changed', async () => {
        const client: TestClient = new TestClient()
        await client.getCatalogSchema()
        const reloads = vi.fn(async () => {})
        client.client.registerCatalogSchemaChangedCallback(catalogName, reloads)

        expect(await client.client.refreshCatalogSchema(catalogName)).toBe(false)
        expect(reloads).not.toHaveBeenCalled()

        client.script.catalogSchemaVersion = 3
        expect(await client.client.refreshCatalogSchema(catalogName)).toBe(true)
        expect(reloads).toHaveBeenCalledTimes(1)
        expect((await client.getCatalogSchema()).version).toBe(3)
    })
})

describe('record limits', () => {
    test('every write-through enforces its store\'s record limit', async () => {
        const client: TestClient = new TestClient()
        const enforceRecordLimit = vi.spyOn(client.persistentCache, 'enforceRecordLimit')

        await client.getCatalogSchema()
        await client.getEntitySchema()
        await flushWrites()

        // the caps themselves live in the layer; what matters here is that no write escapes them, otherwise
        // records of catalogs evitaLab never sees again accumulate forever
        const cappedStores: string[] = enforceRecordLimit.mock.calls.map(call => call[0] as string)
        expect(cappedStores).toContain('catalogStatistics')
        expect(cappedStores).toContain('catalogSchemas')
        expect(cappedStores).toContain('entitySchemas')
        // and each is given a positive cap
        for (const call of enforceRecordLimit.mock.calls) {
            expect(call[1]).toBeGreaterThan(0)
        }
    })
})

describe('data freshness signal', () => {
    test('stays live through a healthy cold start whose disk copy is already current', async () => {
        const firstRun: TestClient = new TestClient()
        await firstRun.getCatalogSchema()

        const secondRun: TestClient = new TestClient()
        expect(secondRun.client.dataFreshness.value).toBe(DataFreshness.Live)

        // served from disk, then confirmed against the server: the badge must never appear, otherwise every
        // startup flashes it and users learn to ignore it
        await secondRun.getCatalogSchema()
        expect(secondRun.client.dataFreshness.value).toBe(DataFreshness.Live)
        await settle()
        expect(secondRun.client.dataFreshness.value).toBe(DataFreshness.Live)
        expect(secondRun.client.unverifiedCachedRecordCount.value).toBe(0)
    })

    test('reports cached data once a revalidation could not reach the server', async () => {
        const firstRun: TestClient = new TestClient()
        await firstRun.getCatalogSchema()

        const secondRun: TestClient = new TestClient({ unreachable: true })
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        try {
            expect((await secondRun.getCatalogSchema()).version).toBe(1)
            await settle()

            expect(secondRun.client.dataFreshness.value).toBe(DataFreshness.Cached)
            // reading a catalog schema restores the catalog listing from disk as well (`queryCatalog` needs it
            // to route the session), so both count as unverified
            expect(secondRun.client.unverifiedCachedRecordCount.value).toBe(2)
        } finally {
            warn.mockRestore()
        }
    })

    test('clears itself when the server comes back, without waiting for a re-read', async () => {
        const firstRun: TestClient = new TestClient()
        await firstRun.getCatalogSchema()

        const secondRun: TestClient = new TestClient({ unreachable: true })
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        try {
            await secondRun.getCatalogSchema()
            await settle()
            expect(secondRun.client.dataFreshness.value).toBe(DataFreshness.Cached)

            // the schema now sits in memory, so nothing would ever read it again and retry its revalidation —
            // the reconnect hook has to retry it actively
            secondRun.script.unreachable = false
            secondRun.client.persistentCacheLayer!.resetRevalidationState()
            await settle()

            expect(secondRun.client.dataFreshness.value).toBe(DataFreshness.Live)
            expect(secondRun.client.unverifiedCachedRecordCount.value).toBe(0)
        } finally {
            warn.mockRestore()
        }
    })

    test('stops reporting a record that has been dropped from disk', async () => {
        const firstRun: TestClient = new TestClient()
        await firstRun.getCatalogSchema()

        const secondRun: TestClient = new TestClient({ unreachable: true })
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        try {
            await secondRun.getCatalogSchema()
            await settle()
            expect(secondRun.client.dataFreshness.value).toBe(DataFreshness.Cached)

            // change evidence drops the persisted copies, so there is nothing unverified left to report - and
            // nothing that could ever be verified either, which would leave the badge lit forever
            await secondRun.client.clearSchemaCache(catalogName)
            await secondRun.client.management.clearCatalogStatisticsCache(CacheInvalidationReason.ChangeEvidence)
            await settle()

            expect(secondRun.client.dataFreshness.value).toBe(DataFreshness.Live)
            expect(secondRun.client.unverifiedCachedRecordCount.value).toBe(0)
        } finally {
            warn.mockRestore()
        }
    })

    test('keeps reporting cached data across a reconnect whose revalidation still fails', async () => {
        const firstRun: TestClient = new TestClient()
        await firstRun.getCatalogSchema()

        const secondRun: TestClient = new TestClient({ unreachable: true })
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        try {
            await secondRun.getCatalogSchema()
            await settle()

            // resetting the revalidation state must not claim a verification that never happened
            secondRun.client.persistentCacheLayer!.resetRevalidationState()
            await settle()

            expect(secondRun.client.dataFreshness.value).toBe(DataFreshness.Cached)
        } finally {
            warn.mockRestore()
        }
    })

    test('a revalidation that fails after its record was dropped does not resurrect the badge', async () => {
        const firstRun: TestClient = new TestClient()
        await firstRun.getCatalogSchema()
        await flushWrites()

        const secondRun: TestClient = new TestClient()
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        // the revalidation the disk-served read schedules is held open, so the record can be dropped while it
        // is still in flight
        let failRevalidation: (e: Error) => void = () => {}
        const revalidation: Promise<boolean> = new Promise<boolean>((_, reject) => { failRevalidation = reject })
        vi.spyOn(secondRun.client, 'refreshCatalogSchema').mockReturnValue(revalidation)
        try {
            await secondRun.getCatalogSchema()

            await secondRun.client.clearSchemaCache(catalogName)
            failRevalidation(new Error('Server unreachable.'))
            await settle()

            // the record it was verifying is gone, so counting it would badge - permanently, since nothing
            // would ever verify a record that no longer exists - data that cannot be served at all
            expect(secondRun.client.dataFreshness.value).toBe(DataFreshness.Live)
            expect(secondRun.client.unverifiedCachedRecordCount.value).toBe(0)
        } finally {
            warn.mockRestore()
        }
    })

    test('a revalidation that fails after the whole cache was purged does not resurrect the badge', async () => {
        const firstRun: TestClient = new TestClient()
        await firstRun.getCatalogSchema()
        await flushWrites()

        const secondRun: TestClient = new TestClient()
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        let failRevalidation: (e: Error) => void = () => {}
        const revalidation: Promise<boolean> = new Promise<boolean>((_, reject) => { failRevalidation = reject })
        vi.spyOn(secondRun.client, 'refreshCatalogSchema').mockReturnValue(revalidation)
        try {
            await secondRun.getCatalogSchema()

            expect(await secondRun.client.clearPersistentCache()).toBe(true)
            failRevalidation(new Error('Server unreachable.'))
            await settle()

            expect(secondRun.client.dataFreshness.value).toBe(DataFreshness.Live)
            expect(secondRun.client.unverifiedCachedRecordCount.value).toBe(0)
        } finally {
            warn.mockRestore()
        }
    })

    test('is live on a client that has not read anything yet', () => {
        const client: EvitaClient = new TestClient().client

        expect(client.dataFreshness.value).toBe(DataFreshness.Live)
        expect(client.unverifiedCachedRecordCount.value).toBe(0)
        expect(client.persistentCacheAvailable.value).toBe(true)
    })

    test('exposes the same signal refs every time, so a watcher cannot end up on a discarded one', () => {
        const client: EvitaClient = new TestClient().client

        expect(client.dataFreshness).toBe(client.dataFreshness)
        expect(client.unverifiedCachedRecordCount).toBe(client.unverifiedCachedRecordCount)
        expect(client.persistentCacheAvailable).toBe(client.persistentCacheAvailable)
    })

    test('purging the cache clears the signal along with the records', async () => {
        const firstRun: TestClient = new TestClient()
        await firstRun.getCatalogSchema()

        const secondRun: TestClient = new TestClient({ unreachable: true })
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        try {
            await secondRun.getCatalogSchema()
            await settle()
            expect(secondRun.client.dataFreshness.value).toBe(DataFreshness.Cached)

            expect(await secondRun.client.clearPersistentCache()).toBe(true)

            // nothing is restored from disk any more, so there is nothing left to be unverified
            expect(secondRun.client.dataFreshness.value).toBe(DataFreshness.Live)
            await expect(secondRun.getCatalogSchema()).rejects.toThrow()
        } finally {
            warn.mockRestore()
        }
    })
})

describe('GraphQL introspection', () => {
    test('persists the introspection on the cold path, so a later run can browse offline', async () => {
        const introspection: IntrospectionQuery = introspectionFromSchema(
            buildSchema('type Query { greeting: String }')
        )
        const firstRun: TestClient = new TestClient()
        firstRun.stubGraphQLIntrospection(introspection)

        // the cold path: nothing cached anywhere, so the accessor introspects - and must write through
        const schema = await firstRun.client.getGraphQLSchema(catalogName, GraphQLInstanceType.Data)
        expect(schema.getQueryType()?.getFields().greeting).not.toBeUndefined()
        await settle()

        const secondRun: TestClient = new TestClient()
        // serving it schedules a revalidation with no endpoint to reach, which warns and is swallowed
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        try {
            // the console of a restarted lab finds the schema without introspecting at all
            const restored = await secondRun.client.persistentCacheLayer!
                .graphQLSchemaCache()
                .getSchema(catalogName, GraphQLInstanceType.Data)
            expect(restored?.schema.getQueryType()?.getFields().greeting).not.toBeUndefined()
            await settle()
        } finally {
            warn.mockRestore()
        }
    })

    test('rebuilds a persisted schema without introspecting the server again', async () => {
        const introspection: IntrospectionQuery = introspectionFromSchema(
            buildSchema('type Query { greeting: String }')
        )
        const firstRun: TestClient = new TestClient()
        firstRun.client.persistentCacheLayer!
            .persistGraphQLIntrospection(catalogName, GraphQLInstanceType.Data, introspection)
        await settle()

        const secondRun: TestClient = new TestClient()
        // serving the persisted introspection schedules its revalidation, which has no GraphQL endpoint to
        // reach here and warns instead - exactly the isolation a failed revalidation is supposed to provide
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        try {
            const restored = await secondRun.client.persistentCacheLayer!
                .graphQLSchemaCache()
                .getSchema(catalogName, GraphQLInstanceType.Data)

            expect(restored?.schema.getQueryType()?.getFields().greeting).not.toBeUndefined()
            await settle()
        } finally {
            warn.mockRestore()
        }
    })

    test('a reload whose persisted schema is already current stays completely silent', async () => {
        const introspection: IntrospectionQuery = introspectionFromSchema(
            buildSchema('type Query { greeting: String }')
        )
        const firstRun: TestClient = new TestClient()
        firstRun.stubGraphQLIntrospection(introspection)
        await firstRun.client.getGraphQLSchema(catalogName, GraphQLInstanceType.Data)
        await flushWrites()

        const secondRun: TestClient = new TestClient()
        secondRun.stubGraphQLIntrospection(introspection)
        const reloads = vi.fn(async () => {})
        secondRun.client.registerGraphQLSchemaChangedCallback(catalogName, GraphQLInstanceType.Data, reloads)

        // the console of a restarted lab is served from disk, which revalidates in the background - through
        // this very refresh. It must compare against the schema being installed, not against the empty cache
        // it started against, or every reload would churn every open console
        await secondRun.client.getGraphQLSchema(catalogName, GraphQLInstanceType.Data)
        await settle()

        expect(reloads).not.toHaveBeenCalled()
    })

    test('a manual reload compares against the schema the console is displaying, not against the disk', async () => {
        const displayed: IntrospectionQuery = introspectionFromSchema(
            buildSchema('type Query { greeting: String }')
        )
        const changed: IntrospectionQuery = introspectionFromSchema(
            buildSchema('type Query { greeting: String, farewell: String }')
        )
        const client: TestClient = new TestClient()
        client.stubGraphQLIntrospection(displayed)
        await client.client.getGraphQLSchema(catalogName, GraphQLInstanceType.Data)
        const reloads = vi.fn(async () => {})
        client.client.registerGraphQLSchemaChangedCallback(catalogName, GraphQLInstanceType.Data, reloads)
        await flushWrites()

        // another tab of the same origin introspected the changed schema and persisted it (last writer wins),
        // so the disk already holds exactly what the reload is about to fetch - while this console still
        // renders the old one
        client.client.persistentCacheLayer
            .persistGraphQLIntrospection(catalogName, GraphQLInstanceType.Data, changed)
        await flushWrites()
        client.stubGraphQLIntrospection(changed)

        expect(await client.client.refreshGraphQLSchema(catalogName, GraphQLInstanceType.Data)).toBe(true)
        expect(reloads).toHaveBeenCalledTimes(1)
        const reloaded = await client.client.getGraphQLSchema(catalogName, GraphQLInstanceType.Data)
        expect(reloaded.getQueryType()?.getFields().farewell).not.toBeUndefined()
    })

    test('a manual reload of an unchanged schema swaps nothing and notifies nobody', async () => {
        const introspection: IntrospectionQuery = introspectionFromSchema(
            buildSchema('type Query { greeting: String }')
        )
        const client: TestClient = new TestClient()
        client.stubGraphQLIntrospection(introspection)
        await client.client.getGraphQLSchema(catalogName, GraphQLInstanceType.Data)
        const reloads = vi.fn(async () => {})
        client.client.registerGraphQLSchemaChangedCallback(catalogName, GraphQLInstanceType.Data, reloads)

        // verified current: no re-render churn in an open console
        expect(await client.client.refreshGraphQLSchema(catalogName, GraphQLInstanceType.Data)).toBe(false)
        expect(reloads).not.toHaveBeenCalled()
    })

    test('a manual reload rebuilds when nothing is cached in memory at all', async () => {
        const introspection: IntrospectionQuery = introspectionFromSchema(
            buildSchema('type Query { greeting: String }')
        )
        const client: TestClient = new TestClient()
        client.stubGraphQLIntrospection(introspection)

        // an unknown in-memory schema cannot be claimed to be current, and a manual reload that silently does
        // nothing is exactly the bug this guards
        expect(await client.client.refreshGraphQLSchema(catalogName, GraphQLInstanceType.Data)).toBe(true)
    })
})
