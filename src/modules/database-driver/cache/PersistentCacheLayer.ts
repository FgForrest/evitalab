import { fromBinary, toBinary } from '@bufbuild/protobuf'
import { ref, watch, type Ref } from 'vue'
import { List as ImmutableList } from 'immutable'
import { buildClientSchema, type GraphQLSchema, type IntrospectionQuery } from 'graphql'
import { LabServerDataCache, ServerDataCacheStore } from '@/modules/storage/LabServerDataCache'
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
import type {
    CatalogSchemaConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogSchemaConverter'
import type {
    CatalogStatisticsConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogStatisticsConverter'
import type { CatalogSchema } from '@/modules/database-driver/request-response/schema/CatalogSchema'
import type { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import type { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import type { EntitySchemaAccessor } from '@/modules/database-driver/request-response/schema/EntitySchemaAccessor'
import type { EvitaClient } from '@/modules/database-driver/EvitaClient'
import type { GraphQLInstanceType } from '@/modules/graphql-console/console/model/GraphQLInstanceType'
import type { CachedGraphQLSchema } from '@/modules/database-driver/GraphQLSchemaCache'
import { DataFreshness } from '@/modules/database-driver/model/DataFreshness'
import {
    isServerUnreachable,
    serverUnreachableState
} from '@/modules/database-driver/model/serverConnectivity'
import type {
    PersistentCatalogStatisticsCache,
    PersistentGraphQLSchemaCache,
    PersistentSchemaCache
} from '@/modules/database-driver/cache/PersistentCacheDelegates'
import { xxh64Hex } from '@/utils/hash'

/** Sole key of the single-record catalog statistics store. */
const catalogStatisticsKey: string = 'catalogStatistics'

/**
 * How long to wait before retrying a re-verification that failed while the server was reachable, and how many
 * times. A server that has just come back is briefly able to answer while still refusing catalog work, so the
 * single attempt triggered by the recovery itself is not enough.
 */
const revalidationRetryDelayMs: number = 3_000
const maxRevalidationRetries: number = 5

/**
 * How many records each store may hold, so the cache cannot grow without bound. When a store goes over its cap,
 * the least-recently-*written* records are evicted — a wrongly evicted record costs one refetch, nothing more.
 *
 * The GraphQL cap is much lower on purpose: an introspection result is orders of magnitude larger than a
 * schema payload.
 */
const recordLimits: Record<ServerDataCacheStore, number> = {
    [ServerDataCacheStore.CatalogStatistics]: 1,
    [ServerDataCacheStore.CatalogSchemas]: 100,
    [ServerDataCacheStore.EntitySchemas]: 500,
    [ServerDataCacheStore.GraphQLIntrospections]: 20
}

/** A persisted list of catalog statistics — the whole catalog listing of the server. */
interface CatalogStatisticsRecord {
    readonly payloads: Uint8Array[]
    readonly storedAt: number
}

/** A persisted schema. The version is kept out of the payload so staleness can be judged without decoding. */
interface SchemaRecord {
    readonly payload: Uint8Array
    readonly version: number
    readonly storedAt: number
}

/** A persisted GraphQL introspection result, with a hash to compare against a fresh one cheaply. */
interface GraphQLIntrospectionRecord {
    readonly introspectionJson: string
    readonly hash: string
    readonly storedAt: number
}

/**
 * The second (on-disk) level of {@link EvitaClient}'s caches: the only component that knows how server data is
 * laid out in {@link LabServerDataCache}, how it is encoded, and how a stored payload becomes an internal
 * model object again.
 *
 * ### What is persisted
 *
 * Exactly what the server sent, **before** conversion: the protobuf messages (`GrpcCatalogSchema`,
 * `GrpcEntitySchema`, `GrpcCatalogStatistics`) in their binary form, and the raw GraphQL introspection result
 * as JSON. Hydration replays those payloads through the very same converters a live fetch uses, so cached and
 * freshly fetched data can never differ in shape. It also means regenerating the gRPC client does not
 * invalidate the cache — protobuf binary is forward/backward compatible.
 *
 * ### Read policy — stale-while-revalidate
 *
 * A disk hit is served **immediately** (that is what makes evitaLab usable right after a reload, and at all
 * while the server is unreachable) and a background revalidation of that key is scheduled at the same time.
 * The revalidation re-fetches, and swaps + notifies only when the fresh version really differs — so the
 * common case, where the disk copy was already current, is completely silent.
 *
 * **Every** value served from disk is revalidated, deduplicated only while one is in flight. The in-memory
 * caches are what keeps that from becoming a storm: a read reaches this layer only when memory has no answer,
 * so a hydrated value is asked for here again solely after its in-memory copy was dropped — precisely the
 * moment its freshness is in doubt again.
 *
 * Failures are never propagated into a read: a revalidation that cannot reach the server logs a warning and
 * releases its key, so a later read may try again.
 */
export class PersistentCacheLayer {

    private readonly persistentCache: LabServerDataCache
    private readonly evitaClientProvider: () => EvitaClient
    private readonly catalogSchemaConverterProvider: () => CatalogSchemaConverter
    private readonly catalogStatisticsConverterProvider: () => CatalogStatisticsConverter

    /**
     * Revalidations running right now, so concurrent readers of the same key start exactly one. Readers
     * routinely arrive together (a tab loads its own schema, the catalog schema and the engine settings in the
     * same tick), and all of them miss the in-memory cache.
     */
    private readonly revalidationsInFlight: Set<string> = new Set()

    /**
     * Revalidations whose record was deleted while they were still in flight. Their failure must not mark the
     * key unverified again: the record they were verifying no longer exists, so the badge would count — and
     * keep counting, since nothing would ever verify it — something that cannot be served at all.
     *
     * Accepted residual race: a *new* read that re-persists the record while the cancelled revalidation is
     * still running is deduplicated by {@link revalidationsInFlight} and therefore skips its own revalidation
     * once; the next read of that key schedules it again.
     */
    private readonly cancelledRevalidations: Set<string> = new Set()

    /**
     * How many times each key's re-verification has been retried since the server was last seen reachable.
     */
    private readonly revalidationRetries: Map<string, number> = new Map()

    /**
     * Write-throughs that have been started but not finished yet. Deletions wait for them — see
     * {@link awaitPendingWrites}.
     */
    private readonly pendingWrites: Set<Promise<void>> = new Set()

    /**
     * Keys that were served from disk and whose revalidation **failed**, mapped to that revalidation so a
     * reconnect can retry exactly those. Drives {@link dataFreshness}.
     */
    private readonly unverifiedKeys: Map<string, () => Promise<void>> = new Map()

    /**
     * Whether everything served so far has been verified against the server. See {@link DataFreshness}; read
     * by the UI through {@link EvitaClient.dataFreshness}.
     */
    readonly dataFreshness: Ref<DataFreshness> = ref(DataFreshness.Live)
    /**
     * How many restored values could not be verified against the server. Feeds the badge's tooltip.
     */
    readonly unverifiedRecordCount: Ref<number> = ref(0)

    constructor(persistentCache: LabServerDataCache,
                evitaClientProvider: () => EvitaClient,
                catalogSchemaConverterProvider: () => CatalogSchemaConverter,
                catalogStatisticsConverterProvider: () => CatalogStatisticsConverter) {
        this.persistentCache = persistentCache
        this.evitaClientProvider = evitaClientProvider
        this.catalogSchemaConverterProvider = catalogSchemaConverterProvider
        this.catalogStatisticsConverterProvider = catalogStatisticsConverterProvider

        // the moment the server is reachable again, verify everything that could not be verified while it was
        // not; nothing else would ever re-read those keys on an idle tab.
        //
        // Watched **synchronously** on purpose: with the default scheduling a recovery that happens in the same
        // tick as the failure preceding it collapses into no net change and the callback never runs.
        watch(
            serverUnreachableState(),
            (unreachable: boolean) => {
                if (!unreachable) {
                    this.resetRevalidationState()
                }
            },
            { flush: 'sync' }
        )
    }

    /**
     * Returns the persistent half of the catalog statistics cache.
     */
    catalogStatisticsCache(): PersistentCatalogStatisticsCache {
        return {
            getCatalogStatistics: async () => await this.readCatalogStatistics(),
            deleteCatalogStatistics: async () => {
                await this.awaitPendingWrites()
                this.forgetUnverified(catalogStatisticsKey)
                await this.persistentCache.delete(ServerDataCacheStore.CatalogStatistics, catalogStatisticsKey)
            }
        }
    }

    /**
     * Returns the persistent half of the schema cache of a single catalog.
     */
    schemaCache(catalogName: string): PersistentSchemaCache {
        return {
            getCatalogSchema: async () => await this.readCatalogSchema(catalogName),
            getEntitySchema: async (entityType: string) => await this.readEntitySchema(catalogName, entityType),
            deleteCatalogSchema: async () => {
                await this.awaitPendingWrites()
                this.forgetUnverified(this.catalogSchemaRevalidationKey(catalogName))
                await this.persistentCache.delete(ServerDataCacheStore.CatalogSchemas, catalogName)
            },
            deleteEntitySchema: async (entityType?: string) => {
                await this.awaitPendingWrites()
                if (entityType == undefined) {
                    this.forgetUnverified(
                        this.entitySchemaRevalidationKey(this.entitySchemaKeyPrefix(catalogName)),
                        true
                    )
                    await this.persistentCache.deleteByPrefix(
                        ServerDataCacheStore.EntitySchemas,
                        this.entitySchemaKeyPrefix(catalogName)
                    )
                } else {
                    this.forgetUnverified(
                        this.entitySchemaRevalidationKey(this.entitySchemaKey(catalogName, entityType))
                    )
                    await this.persistentCache.delete(
                        ServerDataCacheStore.EntitySchemas,
                        this.entitySchemaKey(catalogName, entityType)
                    )
                }
            }
        }
    }

    /**
     * Returns the persistent half of the GraphQL schema cache.
     */
    graphQLSchemaCache(): PersistentGraphQLSchemaCache {
        return {
            getSchema: async (catalogName: string, instanceType: GraphQLInstanceType) =>
                await this.readGraphQLSchema(catalogName, instanceType),
            deleteSchema: async (catalogName: string, instanceType: GraphQLInstanceType) => {
                await this.awaitPendingWrites()
                this.forgetUnverified(this.graphQLSchemaRevalidationKey(
                    this.graphQLIntrospectionKey(catalogName, instanceType)
                ))
                await this.persistentCache.delete(
                    ServerDataCacheStore.GraphQLIntrospections,
                    this.graphQLIntrospectionKey(catalogName, instanceType)
                )
            },
            deleteAllSchemas: async () => {
                await this.awaitPendingWrites()
                this.forgetUnverified(this.graphQLSchemaRevalidationKey(''), true)
                await this.persistentCache.clearStore(ServerDataCacheStore.GraphQLIntrospections)
            }
        }
    }

    /**
     * Persists the catalog listing exactly as the server sent it. Called from the fetch point, where the raw
     * messages are still at hand.
     *
     * Like every `persist*` method this is **fire-and-forget**: persisting is an optimization, so it must
     * neither delay nor fail the fetch that triggered it.
     */
    persistCatalogStatistics(payloads: GrpcCatalogStatistics[]): void {
        this.trackWrite(this.persistentCache.put(
            ServerDataCacheStore.CatalogStatistics,
            catalogStatisticsKey,
            {
                payloads: payloads.map(payload => toBinary(GrpcCatalogStatisticsSchema, payload)),
                storedAt: Date.now()
            } satisfies CatalogStatisticsRecord
        ).then(async () => await this.persistentCache.enforceRecordLimit(
            ServerDataCacheStore.CatalogStatistics,
            recordLimits[ServerDataCacheStore.CatalogStatistics]
        )))
    }

    /**
     * Persists a catalog schema exactly as the server sent it.
     */
    persistCatalogSchema(catalogName: string, payload: GrpcCatalogSchema): void {
        this.trackWrite(this.persistentCache.put(
            ServerDataCacheStore.CatalogSchemas,
            catalogName,
            {
                payload: toBinary(GrpcCatalogSchemaSchema, payload),
                version: payload.version,
                storedAt: Date.now()
            } satisfies SchemaRecord
        ).then(async () => await this.persistentCache.enforceRecordLimit(
            ServerDataCacheStore.CatalogSchemas,
            recordLimits[ServerDataCacheStore.CatalogSchemas]
        )))
    }

    /**
     * Persists an entity schema exactly as the server sent it.
     */
    persistEntitySchema(catalogName: string, payload: GrpcEntitySchema): void {
        this.trackWrite(this.persistentCache.put(
            ServerDataCacheStore.EntitySchemas,
            this.entitySchemaKey(catalogName, payload.name),
            {
                payload: toBinary(GrpcEntitySchemaSchema, payload),
                version: payload.version,
                storedAt: Date.now()
            } satisfies SchemaRecord
        ).then(async () => await this.persistentCache.enforceRecordLimit(
            ServerDataCacheStore.EntitySchemas,
            recordLimits[ServerDataCacheStore.EntitySchemas]
        )))
    }

    /**
     * Persists a raw GraphQL introspection result. The **introspection**, not the built schema, is stored:
     * a `GraphQLSchema` object is not serializable, and rebuilding it from the introspection is exactly what
     * the live path does anyway.
     *
     * @return hash of the persisted introspection, so a caller comparing it against the previous one does not
     *         have to serialize the result twice
     */
    persistGraphQLIntrospection(
        catalogName: string,
        instanceType: GraphQLInstanceType,
        introspection: IntrospectionQuery
    ): string {
        const introspectionJson: string = JSON.stringify(introspection)
        const hash: string = xxh64Hex(introspectionJson)
        this.trackWrite(this.persistentCache.put(
            ServerDataCacheStore.GraphQLIntrospections,
            this.graphQLIntrospectionKey(catalogName, instanceType),
            {
                introspectionJson,
                hash,
                storedAt: Date.now()
            } satisfies GraphQLIntrospectionRecord
        ).then(async () => await this.persistentCache.enforceRecordLimit(
            ServerDataCacheStore.GraphQLIntrospections,
            recordLimits[ServerDataCacheStore.GraphQLIntrospections]
        )))
        return hash
    }

    /**
     * Drops every persisted record belonging to a catalog — its catalog schema, all its entity schemas and
     * the introspections of its GraphQL API instances.
     *
     * Needed by the catalog-level mutations (rename/replace/delete), which discard the whole in-memory cache
     * object of a catalog instead of invalidating it through the cache itself, and would therefore leave the
     * on-disk records behind for the next read to serve.
     */
    async deleteCatalogData(catalogName: string): Promise<void> {
        await this.awaitPendingWrites()
        this.forgetUnverified(this.catalogSchemaRevalidationKey(catalogName))
        this.forgetUnverified(
            this.entitySchemaRevalidationKey(this.entitySchemaKeyPrefix(catalogName)),
            true
        )
        this.forgetUnverified(this.graphQLSchemaRevalidationKey(`${catalogName}:`), true)
        await this.persistentCache.delete(ServerDataCacheStore.CatalogSchemas, catalogName)
        await this.persistentCache.deleteByPrefix(
            ServerDataCacheStore.EntitySchemas,
            this.entitySchemaKeyPrefix(catalogName)
        )
        await this.persistentCache.deleteByPrefix(
            ServerDataCacheStore.GraphQLIntrospections,
            `${catalogName}:`
        )
    }

    /**
     * Drops every persisted catalog and entity schema, of every catalog.
     *
     * The counterpart of {@link PersistentGraphQLSchemaCache.deleteAllSchemas} for the gRPC-model schemas, and
     * needed for the same reason: the wholesale change-evidence clear can only enumerate the catalogs whose
     * schema was read *this session*, while on disk the records of every catalog ever read survive. Purging by
     * store is what makes the persisted side of that funnel independent of what happens to be in memory.
     */
    async deleteAllSchemas(): Promise<void> {
        await this.awaitPendingWrites()
        this.forgetUnverified(this.catalogSchemaRevalidationKey(''), true)
        this.forgetUnverified(this.entitySchemaRevalidationKey(''), true)
        await this.persistentCache.clearStore(ServerDataCacheStore.CatalogSchemas)
        await this.persistentCache.clearStore(ServerDataCacheStore.EntitySchemas)
    }

    /**
     * Re-verifies everything that is currently marked unverified. Invoked when the connection to the server is
     * re-established, and by the wholesale reload: those keys are already in memory, so nothing would ever read
     * them again and re-trigger their revalidation on its own — for an idle tab, never.
     *
     * `unverifiedKeys` itself is deliberately *not* cleared here: claiming verification before a revalidation
     * has actually returned would be a lie. Each entry is removed by its own success.
     */
    resetRevalidationState(): void {
        // a fresh reachability gives every key its retry budget back
        this.revalidationRetries.clear()
        for (const [key, revalidate] of Array.from(this.unverifiedKeys.entries())) {
            this.scheduleRevalidation(key, revalidate)
        }
    }

    /**
     * Discards everything evitaLab has persisted for this connection.
     */
    async clear(): Promise<void> {
        // nothing is restored from disk any more, so there is nothing left to be unverified
        this.unverifiedKeys.clear()
        // everything persisted is being discarded, so no revalidation still running may report on it
        for (const keyInFlight of this.revalidationsInFlight) {
            this.cancelledRevalidations.add(keyInFlight)
        }
        this.publishFreshness()
        await this.awaitPendingWrites()
        await this.persistentCache.clear()
    }

    /**
     * Remembers a write-through until it finishes.
     */
    private trackWrite(write: Promise<void>): void {
        this.pendingWrites.add(write)
        void write.finally(() => this.pendingWrites.delete(write))
    }

    /**
     * Waits until no write-through is in flight any more.
     *
     * Every deletion must do this first. Write-throughs are fire-and-forget, so one that started before the
     * deletion would otherwise be free to land *after* it and resurrect the very record the deletion removed —
     * a stale schema that then survives every restart until something else happens to overwrite it.
     */
    private async awaitPendingWrites(): Promise<void> {
        while (this.pendingWrites.size > 0) {
            await Promise.allSettled(Array.from(this.pendingWrites))
        }
    }

    private async readCatalogStatistics(): Promise<ImmutableList<CatalogStatistics> | undefined> {
        const record: CatalogStatisticsRecord | undefined = await this.persistentCache.get(
            ServerDataCacheStore.CatalogStatistics,
            catalogStatisticsKey
        )
        if (record == undefined) {
            return undefined
        }
        try {
            const statistics: ImmutableList<CatalogStatistics> = ImmutableList(
                record.payloads.map(payload => this.catalogStatisticsConverterProvider()
                    .convert(fromBinary(GrpcCatalogStatisticsSchema, payload)))
            )
            this.scheduleRevalidation(
                catalogStatisticsKey,
                async () => { await this.evitaClientProvider().management.refreshCatalogStatistics() }
            )
            return statistics
        } catch (e) {
            await this.discardUnreadableRecord(ServerDataCacheStore.CatalogStatistics, catalogStatisticsKey, e)
            return undefined
        }
    }

    private async readCatalogSchema(catalogName: string): Promise<CatalogSchema | undefined> {
        const record: SchemaRecord | undefined = await this.persistentCache.get(
            ServerDataCacheStore.CatalogSchemas,
            catalogName
        )
        if (record == undefined) {
            return undefined
        }
        try {
            const catalogSchema: CatalogSchema = this.catalogSchemaConverterProvider().convert(
                fromBinary(GrpcCatalogSchemaSchema, record.payload),
                this.entitySchemaAccessorFor(catalogName)
            )
            this.scheduleRevalidation(
                this.catalogSchemaRevalidationKey(catalogName),
                async () => { await this.evitaClientProvider().refreshCatalogSchema(catalogName) }
            )
            return catalogSchema
        } catch (e) {
            await this.discardUnreadableRecord(ServerDataCacheStore.CatalogSchemas, catalogName, e)
            return undefined
        }
    }

    private async readEntitySchema(catalogName: string, entityType: string): Promise<EntitySchema | undefined> {
        const key: string = this.entitySchemaKey(catalogName, entityType)
        const record: SchemaRecord | undefined = await this.persistentCache.get(
            ServerDataCacheStore.EntitySchemas,
            key
        )
        if (record == undefined) {
            return undefined
        }
        try {
            const entitySchema: EntitySchema = this.catalogSchemaConverterProvider()
                .convertEntitySchema(fromBinary(GrpcEntitySchemaSchema, record.payload))
            this.scheduleRevalidation(
                this.entitySchemaRevalidationKey(key),
                async () => { await this.evitaClientProvider().refreshEntitySchema(catalogName, entityType) }
            )
            return entitySchema
        } catch (e) {
            await this.discardUnreadableRecord(ServerDataCacheStore.EntitySchemas, key, e)
            return undefined
        }
    }

    private async readGraphQLSchema(
        catalogName: string,
        instanceType: GraphQLInstanceType
    ): Promise<CachedGraphQLSchema | undefined> {
        const key: string = this.graphQLIntrospectionKey(catalogName, instanceType)
        const record: GraphQLIntrospectionRecord | undefined = await this.persistentCache.get(
            ServerDataCacheStore.GraphQLIntrospections,
            key
        )
        if (record == undefined) {
            return undefined
        }
        try {
            const schema: GraphQLSchema = buildClientSchema(
                JSON.parse(record.introspectionJson) as IntrospectionQuery
            )
            this.scheduleRevalidation(
                this.graphQLSchemaRevalidationKey(key),
                async () => {
                    await this.evitaClientProvider().refreshGraphQLSchema(catalogName, instanceType)
                }
            )
            return { schema, introspectionHash: record.hash }
        } catch (e) {
            await this.discardUnreadableRecord(ServerDataCacheStore.GraphQLIntrospections, key, e)
            return undefined
        }
    }

    /**
     * Starts the background revalidation of a key, unless one is running for it already.
     *
     * Deliberately not awaitable and not addressable: the read it belongs to has already returned the best
     * data available, and freshness reaches the UI exclusively through the existing change callbacks. That
     * keeps a single reactivity mechanism in the application — a reader cannot tell a revalidation apart from
     * a change pushed by the server.
     */
    private scheduleRevalidation(key: string, revalidate: () => Promise<void>): void {
        if (this.revalidationsInFlight.has(key)) {
            return
        }
        this.revalidationsInFlight.add(key)
        void revalidate()
            .then(() => this.markVerified(key))
            .catch((e: unknown) => {
                if (this.cancelledRevalidations.has(key)) {
                    // the record was deleted underneath this revalidation, so its failure says nothing about
                    // anything that is still served
                    console.warn(`Ignoring the failed revalidation of the meanwhile deleted '${key}': `, e)
                    return
                }
                // the server is (still) unreachable; keep serving the persisted copy, allow a later read to
                // verify it again, and tell the UI that what it shows is unverified
                console.warn(`Could not revalidate the cached '${key}' against the server: `, e)
                this.markUnverified(key, revalidate)
                this.retryRevalidationWhileReachable(key, revalidate)
            })
            .finally(() => {
                this.revalidationsInFlight.delete(key)
                this.cancelledRevalidations.delete(key)
            })
    }

    /**
     * Retries a failed re-verification while the server is reachable, so a server that answered but was not yet
     * able to serve catalog data does not leave the key unverified forever. Does nothing while offline — the
     * recovery transition retries everything anyway.
     */
    private retryRevalidationWhileReachable(key: string, revalidate: () => Promise<void>): void {
        if (isServerUnreachable()) {
            return
        }
        const attempts: number = (this.revalidationRetries.get(key) ?? 0) + 1
        if (attempts > maxRevalidationRetries) {
            console.warn(`Giving up on re-verifying the cached '${key}'; it stays marked as unverified.`)
            return
        }
        this.revalidationRetries.set(key, attempts)
        setTimeout(() => {
            if (this.unverifiedKeys.has(key)) {
                this.scheduleRevalidation(key, revalidate)
            }
        }, revalidationRetryDelayMs)
    }

    /**
     * Records that a key has been confirmed against the server (whether or not its value changed).
     */
    private markVerified(key: string): void {
        this.revalidationRetries.delete(key)
        if (this.unverifiedKeys.delete(key)) {
            this.publishFreshness()
        }
    }

    /**
     * Forgets that a key is unverified, because its record has been deleted.
     *
     * A record that is no longer on disk cannot be served, so nothing about it is unverified any more — and
     * nothing would ever verify it either, which would leave the "unverified data" badge counting a record that
     * does not exist.
     *
     * @param prefix when true, every unverified key starting with the given value is forgotten
     */
    private forgetUnverified(key: string, prefix: boolean = false): void {
        let forgotten: boolean = false
        for (const unverifiedKey of Array.from(this.unverifiedKeys.keys())) {
            if (prefix ? unverifiedKey.startsWith(key) : unverifiedKey === key) {
                this.unverifiedKeys.delete(unverifiedKey)
                this.revalidationRetries.delete(unverifiedKey)
                forgotten = true
            }
        }
        // a revalidation that is still running would otherwise re-add its key on failure, and the record it
        // was verifying is about to be gone
        for (const keyInFlight of this.revalidationsInFlight) {
            if (prefix ? keyInFlight.startsWith(key) : keyInFlight === key) {
                this.cancelledRevalidations.add(keyInFlight)
            }
        }
        if (forgotten) {
            this.publishFreshness()
        }
    }

    /**
     * Records that a key restored from disk could not be confirmed against the server, remembering how to
     * retry it once the server is reachable again.
     */
    private markUnverified(key: string, revalidate: () => Promise<void>): void {
        const alreadyUnverified: boolean = this.unverifiedKeys.has(key)
        this.unverifiedKeys.set(key, revalidate)
        if (!alreadyUnverified) {
            this.publishFreshness()
        }
    }

    private publishFreshness(): void {
        this.unverifiedRecordCount.value = this.unverifiedKeys.size
        this.dataFreshness.value = this.unverifiedKeys.size > 0
            ? DataFreshness.Cached
            : DataFreshness.Live
    }

    /**
     * Drops a record that could not be decoded. Keeping it would fail every future read the same way, and the
     * caller falls back to the server, which produces a readable replacement.
     */
    private async discardUnreadableRecord(store: ServerDataCacheStore, key: string, e: unknown): Promise<void> {
        console.warn(`Discarding unreadable persistent cache record '${key}' of store '${store}': `, e)
        await this.persistentCache.delete(store, key)
    }

    /**
     * Accessor handed to a hydrated catalog schema for its lazily resolved entity schemas.
     *
     * It goes through the ordinary public read path, so the entity schemas it resolves come from memory, from
     * disk or from the server, whichever is available — the same choice the catalog schema itself went
     * through. It cannot re-enter the hydration in flight: a catalog schema dereferences its accessor lazily
     * (never during conversion) and the accessor only ever reads *entity* schemas.
     */
    private entitySchemaAccessorFor(catalogName: string): EntitySchemaAccessor {
        const evitaClientProvider: () => EvitaClient = this.evitaClientProvider
        return {
            async getEntitySchema(entityType: string): Promise<EntitySchema | undefined> {
                return await evitaClientProvider().queryCatalog(
                    catalogName,
                    async (session) => await session.getEntitySchema(entityType)
                )
            },
            async getEntitySchemas(): Promise<ImmutableList<EntitySchema>> {
                return await evitaClientProvider().queryCatalog(catalogName, async (session) => {
                    const entityTypes: ImmutableList<string> = await session.getAllEntityTypes()
                    const entitySchemas: EntitySchema[] = []
                    for (const entityType of entityTypes) {
                        const entitySchema: EntitySchema | undefined = await session.getEntitySchema(entityType)
                        if (entitySchema != undefined) {
                            entitySchemas.push(entitySchema)
                        }
                    }
                    return ImmutableList(entitySchemas)
                })
            }
        }
    }

    private entitySchemaKey(catalogName: string, entityType: string): string {
        return `${this.entitySchemaKeyPrefix(catalogName)}${entityType}`
    }

    private entitySchemaKeyPrefix(catalogName: string): string {
        return `${catalogName}:`
    }

    private graphQLIntrospectionKey(catalogName: string, instanceType: GraphQLInstanceType): string {
        return `${catalogName}:${instanceType}`
    }

    /**
     * Keys under which revalidations are tracked. Separate from the store keys above because they share one
     * namespace across all four stores, and because a deletion has to address exactly what a read registered.
     */
    private catalogSchemaRevalidationKey(catalogName: string): string {
        return `catalogSchema:${catalogName}`
    }

    private entitySchemaRevalidationKey(entitySchemaKey: string): string {
        return `entitySchema:${entitySchemaKey}`
    }

    private graphQLSchemaRevalidationKey(graphQLIntrospectionKey: string): string {
        return `graphQLSchema:${graphQLIntrospectionKey}`
    }
}
