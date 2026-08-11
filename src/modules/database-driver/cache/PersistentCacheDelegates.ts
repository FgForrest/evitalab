/**
 * Second-level (on-disk) half of the in-memory caches, as the caches themselves see it.
 *
 * The interfaces below are deliberately **transport-free and evitaDB-wire-free**: they speak only the internal
 * model, so the cache classes keep their documented property of having no HTTP/gRPC coupling. The single
 * implementation ({@link PersistentCacheLayer}) is the only place that knows the on-disk layout, the payload
 * encoding and how a stored payload is turned back into an internal model object.
 *
 * A delegate returning `undefined` means "not cached on disk" — indistinguishable, on purpose, from "the disk
 * cache is unavailable". Every method is expected to resolve rather than reject, so a cache lookup can never
 * break the read that triggered it.
 */

import type { List as ImmutableList } from 'immutable'
import type { CatalogSchema } from '@/modules/database-driver/request-response/schema/CatalogSchema'
import type { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import type { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import type { GraphQLInstanceType } from '@/modules/graphql-console/console/model/GraphQLInstanceType'
import type { CachedGraphQLSchema } from '@/modules/database-driver/GraphQLSchemaCache'

/**
 * Persistent half of an {@link EvitaSchemaCache} — always scoped to the one catalog its cache belongs to.
 */
export interface PersistentSchemaCache {

    /**
     * Returns the persisted catalog schema, scheduling a background revalidation when it serves one.
     */
    getCatalogSchema(): Promise<CatalogSchema | undefined>

    /**
     * Returns the persisted schema of the entity type, scheduling a background revalidation when it serves one.
     */
    getEntitySchema(entityType: string): Promise<EntitySchema | undefined>

    /**
     * Drops the persisted catalog schema.
     */
    deleteCatalogSchema(): Promise<void>

    /**
     * Drops the persisted schema of the entity type, or of every entity type of the catalog when no type is
     * given.
     */
    deleteEntitySchema(entityType?: string): Promise<void>
}

/**
 * Persistent half of the {@link EvitaCatalogStatisticsCache}.
 */
export interface PersistentCatalogStatisticsCache {

    /**
     * Returns the persisted catalog statistics, scheduling a background revalidation when it serves them.
     */
    getCatalogStatistics(): Promise<ImmutableList<CatalogStatistics> | undefined>

    /**
     * Drops the persisted catalog statistics.
     */
    deleteCatalogStatistics(): Promise<void>
}

/**
 * Persistent half of the {@link GraphQLSchemaCache}. Rebuilds the schema object from the persisted raw
 * introspection result, exactly as a live introspection would.
 */
export interface PersistentGraphQLSchemaCache {

    /**
     * Returns the GraphQL schema rebuilt from persisted introspection — together with the hash of that
     * introspection, so the cache can tell later what the schema it holds was built from — and schedules a
     * background revalidation when it serves one.
     */
    getSchema(catalogName: string, instanceType: GraphQLInstanceType): Promise<CachedGraphQLSchema | undefined>

    /**
     * Drops the persisted introspection of a single GraphQL API instance.
     */
    deleteSchema(catalogName: string, instanceType: GraphQLInstanceType): Promise<void>

    /**
     * Drops every persisted introspection. Needed by the wholesale clear, which cannot enumerate the keys —
     * on disk they outlive the in-memory ones by design.
     */
    deleteAllSchemas(): Promise<void>
}
