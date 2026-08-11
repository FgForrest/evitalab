import { deleteDB, openDB, type IDBPDatabase } from 'idb'
import { readonly, ref, type InjectionKey, type Ref } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { xxh64Hex } from '@/utils/hash'

/**
 * Format version of the records stored in the persistent cache.
 *
 * Bump it only on a **breaking** change to the record layout or to the meaning of the stored payloads.
 * Regenerating the gRPC client does not require a bump: the payloads are protobuf binary, which is
 * forward/backward compatible. A bump abandons every previously written database (they are named after the
 * version), and the abandoned ones are deleted on the next startup.
 */
const cacheFormatVersion: number = 2

/**
 * Index every store carries over its records' `storedAt`, so eviction can find the oldest records without
 * reading a single payload. It is also the reason {@link cacheFormatVersion} is 2: an index is part of the
 * store layout, and a database written by an earlier format simply does not have it.
 */
const storedAtIndexName: string = 'storedAt'

/**
 * Common prefix of every database evitaLab uses for its persistent cache. Only a naming convention, not an
 * access boundary — see the module documentation.
 */
const databaseNamePrefix: string = 'evitaLab-cache'

const databaseNamePattern: RegExp = new RegExp(`^${databaseNamePrefix}:[^:]+:(?<formatVersion>\\d+)$`)

/**
 * Object stores of the persistent cache. Each holds records of a single kind, keyed as documented by its
 * writer ({@link PersistentCacheLayer} in the `database-driver` module is the only one).
 */
export enum ServerDataCacheStore {
    CatalogStatistics = 'catalogStatistics',
    CatalogSchemas = 'catalogSchemas',
    EntitySchemas = 'entitySchemas',
    GraphQLIntrospections = 'graphqlIntrospections'
}

export const labServerDataCacheInjectionKey: InjectionKey<LabServerDataCache> = Symbol('labServerDataCache')

/**
 * Client-side cache of data fetched from an evitaDB server — schemas, catalog statistics, GraphQL
 * introspections — backed by browser IndexedDB (through the thin
 * [`idb`](https://github.com/jakearchibald/idb) wrapper).
 *
 * ### A cache, not storage — and the distinction is load-bearing
 *
 * The sibling {@link LabStorage} is evitaLab's **durable** store: open tabs, preferences, anything the user
 * would notice losing. This class is the opposite, and everything about it assumes its contents are
 * re-fetchable from the server:
 *
 * - records are **evicted by age** once a store goes over its cap ({@link enforceRecordLimit});
 * - a {@link cacheFormatVersion} bump **abandons every record** ever written;
 * - a failed write is **dropped silently** — no operation ever throws.
 *
 * **Never keep anything here that cannot simply be fetched again.** For that, use {@link LabStorage}.
 *
 * Both are equally *persistent* in the browser sense, which is why neither name says so; they differ in
 * durability of intent, and in mechanism — this one is asynchronous, holds structured values (including binary
 * payloads) and is not bound by the ~5 MB local storage quota, which is what makes it usable for schemas at all.
 *
 * The cache knows nothing about evitaDB types: it stores and returns records exactly as it was given them.
 *
 * **No operation ever throws.** A failing (or entirely unavailable) IndexedDB must never break a data path:
 * reads degrade to a miss and writes are dropped. Callers therefore treat `undefined` as "not cached" without
 * having to distinguish it from "storage broken".
 *
 * ### When the browser will not let us store anything
 *
 * Storage can be missing or refused for reasons evitaLab cannot influence: a hardened or policy-restricted
 * profile, a third-party (cross-origin) context with site data blocked, an opaque `file://` origin, a corrupt
 * profile. Failures also come in a milder kind — a full disk, or the browser evicting the connection under
 * storage pressure — which say nothing about whether storage works in general.
 *
 * The two are treated differently, because turning the cache off for a single oversized record would be worse
 * than keeping it:
 *
 * - **fatal** (opening the database is impossible) — {@link usable} flips to `false` and every subsequent
 *   operation short-circuits *before* touching IndexedDB. Reported once, not per call.
 * - **connection lost** (the browser closed a working connection) — the handle is dropped and reopened **once**;
 *   only a failing reopen is fatal, because a browser that killed a connection under pressure usually accepts
 *   a fresh one.
 * - **transient** (quota exceeded, aborted transaction) — that single operation is dropped and the cache keeps
 *   working. Warned once per store until an operation on it succeeds again, so a full disk cannot turn every
 *   write into console noise.
 *
 * Databases are namespaced per server/connection and per {@link cacheFormatVersion}, mirroring
 * {@link LabStorage}. Databases of a *different* format version are deleted on startup, so an abandoned
 * format never lingers on the user's disk.
 */
export class LabServerDataCache {

    private readonly providerHash: string
    private readonly databaseName: string
    /**
     * Opened database, or `undefined` when it could not be opened. Opened lazily on first use and remembered,
     * so a broken IndexedDB is not retried on every single read.
     */
    private database?: Promise<IDBPDatabase | undefined>
    /**
     * Whether storage is usable at all. Starts optimistic and flips on the first fatal failure — for a browser
     * without IndexedDB that is known synchronously, otherwise only once something has actually been read or
     * written.
     */
    private readonly storageUsable: Ref<boolean> = ref(true)
    /** Held as a field, so every consumer watches the same ref. */
    private readonly storageUsableReadonly: Readonly<Ref<boolean>> = readonly(this.storageUsable)
    /**
     * Stores whose last transient failure has already been reported, so a persistently full disk warns once per
     * store rather than once per write. Cleared for a store as soon as an operation on it succeeds.
     */
    private readonly transientFailuresReported: Set<ServerDataCacheStore> = new Set()
    /**
     * Whether the single reopen a lost connection is entitled to has been spent. Reset by every successful open.
     */
    private reopenSpent: boolean = false

    constructor(providerName: string) {
        this.providerHash = xxh64Hex(providerName)
        this.databaseName = this.databaseNameOfFormatVersion(cacheFormatVersion)
        if (typeof indexedDB === 'undefined') {
            // knowable without opening anything, so the UI can report it from the first paint rather than
            // after whatever happens to read first
            this.markUnusable('IndexedDB is not available in this browser')
        }
        // deliberately not awaited: sweeping abandoned formats must not delay application startup, and
        // nothing depends on its outcome
        void this.deleteAbandonedFormatVersions()
    }

    /**
     * Whether evitaLab can persist anything at all. `false` means every operation is a no-op — the application
     * stays fully functional and simply starts cold after each reload.
     */
    get usable(): Readonly<Ref<boolean>> {
        return this.storageUsableReadonly
    }

    /**
     * Returns the record stored under the key, or `undefined` when there is none (or the cache is unusable).
     */
    async get<V>(store: ServerDataCacheStore, key: string): Promise<V | undefined> {
        if (!this.storageUsable.value) {
            return undefined
        }
        try {
            const database: IDBPDatabase | undefined = await this.openDatabase()
            const record: V | undefined = await database?.get(store, key) as V | undefined
            this.transientFailuresReported.delete(store)
            return record
        } catch (e) {
            this.classifyOperationFailure(e, store, `read '${key}' from`)
            return undefined
        }
    }

    /**
     * Stores the record under the key, replacing whatever was there. Records are always written whole, so
     * concurrent writers (e.g. several evitaLab tabs of the same origin) resolve to last-writer-wins.
     */
    async put(store: ServerDataCacheStore, key: string, record: unknown): Promise<void> {
        if (!this.storageUsable.value) {
            return
        }
        try {
            const database: IDBPDatabase | undefined = await this.openDatabase()
            await database?.put(store, record, key)
            this.transientFailuresReported.delete(store)
        } catch (e) {
            this.classifyOperationFailure(e, store, `write '${key}' into`)
        }
    }

    /**
     * Removes the record stored under the key. Removing a missing record is not an error.
     */
    async delete(store: ServerDataCacheStore, key: string): Promise<void> {
        if (!this.storageUsable.value) {
            return
        }
        try {
            const database: IDBPDatabase | undefined = await this.openDatabase()
            await database?.delete(store, key)
            this.transientFailuresReported.delete(store)
        } catch (e) {
            this.classifyOperationFailure(e, store, `delete '${key}' from`)
        }
    }

    /**
     * Removes every record whose key starts with the prefix. Used to drop all records belonging to a single
     * catalog, whose entity-level keys are not enumerable any other way.
     */
    async deleteByPrefix(store: ServerDataCacheStore, keyPrefix: string): Promise<void> {
        if (!this.storageUsable.value) {
            return
        }
        try {
            const database: IDBPDatabase | undefined = await this.openDatabase()
            if (database == undefined) {
                return
            }
            const keys: IDBValidKey[] = await database.getAllKeys(store)
            for (const key of keys) {
                if (typeof key === 'string' && key.startsWith(keyPrefix)) {
                    await database.delete(store, key)
                }
            }
            this.transientFailuresReported.delete(store)
        } catch (e) {
            this.classifyOperationFailure(e, store, `delete records prefixed with '${keyPrefix}' from`)
        }
    }

    /**
     * Deletes the least-recently-**written** records of a store until at most `maxRecords` remain, keeping the
     * cache from growing without bound. Records of a store whose count is within the limit are not touched,
     * and the count check is cheap, so this is safe to call after every write.
     *
     * Age is taken from each record's `storedAt` through the store's {@link storedAtIndexName} index, walked by
     * a **key cursor** — which reads index keys and primary keys only, never a payload. That matters because a
     * store sitting at its cap runs this on every single write, and the payloads here are whole schemas and
     * introspection results.
     *
     * The whole pass runs in **one** read-write transaction, so a write landing in the middle of it cannot
     * misalign the key→age pairing and get the wrong record evicted.
     *
     * A record without `storedAt` is not in the index and therefore never sorts "as the oldest"; since every
     * writer stamps one and abandoned formats are never read, no such record can exist — the surplus fallback
     * below only keeps the cap honest if one ever did.
     */
    async enforceRecordLimit(store: ServerDataCacheStore, maxRecords: number): Promise<void> {
        if (!this.storageUsable.value) {
            return
        }
        try {
            const database: IDBPDatabase | undefined = await this.openDatabase()
            if (database == undefined) {
                return
            }
            const transaction = database.transaction(store, 'readwrite')
            const recordCount: number = await transaction.store.count()
            let surplus: number = recordCount - maxRecords
            if (surplus <= 0) {
                await transaction.done
                return
            }

            const deletions: Promise<void>[] = []
            const evictedKeys: Set<IDBValidKey> = new Set()
            // ascending index order is oldest first
            let cursor = await transaction.store.index(storedAtIndexName).openKeyCursor()
            while (cursor != undefined && surplus > 0) {
                deletions.push(transaction.store.delete(cursor.primaryKey))
                evictedKeys.add(cursor.primaryKey)
                surplus--
                cursor = await cursor.continue()
            }
            if (surplus > 0) {
                // can't happen while every writer stamps `storedAt`, but a store over its cap with nothing
                // left to evict would stay over it forever
                for (const key of await transaction.store.getAllKeys()) {
                    if (surplus <= 0) {
                        break
                    }
                    if (!evictedKeys.has(key)) {
                        deletions.push(transaction.store.delete(key))
                        surplus--
                    }
                }
            }
            await Promise.all(deletions)
            await transaction.done
            this.transientFailuresReported.delete(store)
        } catch (e) {
            // deliberately not classified: eviction is maintenance, not a data path, so a failure here must not
            // spend the single reopen that a real read may be about to need. It also cannot mean a full disk —
            // this method only counts, reads and deletes
            this.reportTransientFailure(e, store, 'enforce the record limit of')
        }
    }

    /**
     * Removes every record of a single store.
     *
     * Deliberately attempted even when storage has been declared unusable, unlike the reads and writes above:
     * this backs an explicit user-requested purge, and storage that was written successfully before it broke may
     * still hold records the user is asking to be rid of.
     */
    async clearStore(store: ServerDataCacheStore): Promise<void> {
        try {
            const database: IDBPDatabase | undefined = await this.openDatabase()
            await database?.clear(store)
        } catch (e) {
            console.warn(`Could not clear the persistent cache store '${store}': `, e)
        }
    }

    /**
     * Discards the entire persisted cache of this connection. Backs an explicit user-requested purge; no
     * data path relies on it.
     */
    async clear(): Promise<void> {
        for (const store of Object.values(ServerDataCacheStore)) {
            await this.clearStore(store)
        }
    }

    private openDatabase(): Promise<IDBPDatabase | undefined> {
        if (this.database == undefined) {
            this.database = this.doOpenDatabase()
        }
        return this.database
    }

    private async doOpenDatabase(): Promise<IDBPDatabase | undefined> {
        if (typeof indexedDB === 'undefined') {
            this.markUnusable('IndexedDB is not available in this browser')
            return undefined
        }
        try {
            const database: IDBPDatabase = await openDB(this.databaseName, 1, {
                upgrade(database: IDBPDatabase): void {
                    for (const store of Object.values(ServerDataCacheStore)) {
                        if (!database.objectStoreNames.contains(store)) {
                            database.createObjectStore(store)
                                .createIndex(storedAtIndexName, storedAtIndexName)
                        }
                    }
                },
                // the browser closed the connection (storage reclaimed, site data cleared): let the next
                // operation open a fresh one instead of failing against a dead handle
                terminated: () => this.forgetConnection(),
                // unreachable as long as the format version lives in the database *name* rather than in its
                // IndexedDB version, because then no tab ever requests a different version of the same database.
                // Logged rather than ignored, because the alternative is an open that never settles
                blocked: () => console.warn(
                    `Opening the persistent cache database '${this.databaseName}' is blocked by another connection.`
                )
            })
            // an open that succeeded restores the reopen entitlement: each lost connection gets its own retry
            this.reopenSpent = false
            return database
        } catch (e) {
            this.markUnusable('the persistent cache database could not be opened', e)
            return undefined
        }
    }

    /**
     * Classifies a failure of a single operation. See the class documentation for why the three outcomes differ;
     * the summary is that only an unopenable database says anything about storage as a whole.
     *
     * @param attemptedAction phrased to read after "Could not " and before the store name
     */
    private classifyOperationFailure(e: unknown, store: ServerDataCacheStore, attemptedAction: string): void {
        if (this.isConnectionLost(e)) {
            this.reopenLostConnection(e)
            return
        }
        this.reportTransientFailure(e, store, attemptedAction)
    }

    /**
     * Reports a failure that costs one operation and nothing more. Once per store, because the usual cause (a
     * full disk) would otherwise warn on every write for as long as it lasts; the store is eligible again as
     * soon as an operation on it succeeds.
     */
    private reportTransientFailure(e: unknown, store: ServerDataCacheStore, attemptedAction: string): void {
        if (!this.transientFailuresReported.has(store)) {
            this.transientFailuresReported.add(store)
            console.warn(`Could not ${attemptedAction} the persistent cache store '${store}': `, e)
        }
    }

    /**
     * Whether the failure means the connection evitaLab held has been closed underneath it — the browser
     * reclaiming storage, the user clearing site data, the database being deleted elsewhere.
     */
    private isConnectionLost(e: unknown): boolean {
        // an aborted transaction is deliberately absent: that is a transient failure of one operation, most
        // often the quota being hit, and the connection behind it is still perfectly good
        return e instanceof DOMException &&
            (e.name === 'InvalidStateError' || e.name === 'NotFoundError')
    }

    /**
     * Drops the closed connection so the next operation opens a fresh one, once. A browser that closed a
     * working connection under storage pressure usually accepts a replacement, so this is worth one attempt —
     * but only one, otherwise a permanently refusing storage would be reopened on every read.
     */
    private reopenLostConnection(e: unknown): void {
        if (this.reopenSpent) {
            this.markUnusable('the persistent cache connection was lost and could not be re-established', e)
            return
        }
        this.reopenSpent = true
        this.forgetConnection()
    }

    /**
     * Forgets the current connection so the next operation opens a fresh one, **without** spending the single
     * reopen a lost connection is entitled to.
     *
     * This is what the browser's own close notification does, and keeping it free of the budget is load-bearing:
     * one termination usually raises *two* signals — the close event and the failure of whatever operation was in
     * flight — and if both spent from the budget, the very first termination would exhaust it and latch storage
     * off without ever having tried to reopen.
     */
    private forgetConnection(): void {
        this.database = undefined
    }

    /**
     * Declares storage unusable: every operation becomes a no-op from here on. Reported exactly once — the
     * whole point of the latch is that a broken environment does not narrate itself on every read.
     */
    private markUnusable(reason: string, e?: unknown): void {
        if (!this.storageUsable.value) {
            return
        }
        this.storageUsable.value = false
        const message: string = `Persistent cache disabled: ${reason}. evitaLab stays fully functional, it just starts cold after every reload.`
        if (e == undefined) {
            console.warn(message)
        } else {
            console.warn(message, e)
        }
    }

    private databaseNameOfFormatVersion(formatVersion: number): string {
        return `${databaseNamePrefix}:${this.providerHash}:${formatVersion}`
    }

    /**
     * Deletes evitaLab cache databases written by a different {@link cacheFormatVersion}: records of an
     * abandoned format are unreadable, so leaving them behind would only occupy the user's disk.
     *
     * Done in two ways, because `indexedDB.databases()` is not available everywhere (Firefox does not implement
     * it). This connection's **own** older databases are addressed by name, which needs no enumeration and
     * therefore works in every browser; enumeration then only adds the databases of *other* connections, and
     * where it is missing those are merely left unused, never read.
     */
    private async deleteAbandonedFormatVersions(): Promise<void> {
        if (typeof indexedDB === 'undefined') {
            return
        }
        for (let formatVersion: number = 1; formatVersion < cacheFormatVersion; formatVersion++) {
            try {
                // deleting a database that does not exist is a no-op, so this needs no prior check
                await deleteDB(this.databaseNameOfFormatVersion(formatVersion))
            } catch (e) {
                console.warn(`Could not delete the abandoned persistent cache database of format version ${formatVersion}: `, e)
            }
        }
        try {
            if (typeof indexedDB.databases !== 'function') {
                return
            }
            const databases: IDBDatabaseInfo[] = await indexedDB.databases()
            for (const database of databases) {
                const name: string | undefined = database.name
                if (name == undefined) {
                    continue
                }
                const formatVersion: string | undefined = name.match(databaseNamePattern)?.groups?.formatVersion
                if (formatVersion != undefined && Number(formatVersion) !== cacheFormatVersion) {
                    await deleteDB(name)
                }
            }
        } catch (e) {
            console.warn('Could not sweep persistent cache databases of outdated formats: ', e)
        }
    }
}

export const useLabServerDataCache = (): LabServerDataCache => {
    return mandatoryInject(labServerDataCacheInjectionKey) as LabServerDataCache
}
