import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, test, vi, type MockInstance } from 'vitest'
import { LabServerDataCache, ServerDataCacheStore } from '@/modules/storage/LabServerDataCache'

/**
 * Tests for the persistent cache facade. It is a plain key-value store over IndexedDB, so what is worth
 * pinning down is the record handling around it: prefix deletion (the only way persisted per-catalog records
 * can be enumerated) and the promise that no operation ever throws — a cache is an optimization, and a broken
 * or absent IndexedDB must degrade to a miss rather than break a data path.
 */

let cache: LabServerDataCache

beforeEach(async () => {
    cache = new LabServerDataCache(`http://localhost:5555/${Math.random()}`)
    await cache.clear()
})

describe('record handling', () => {
    test('stores and returns a record unchanged, including binary payloads', async () => {
        await cache.put(ServerDataCacheStore.CatalogSchemas, 'shop', {
            payload: new Uint8Array([1, 2, 3]),
            version: 42,
            storedAt: 1
        })

        const record = await cache.get<{ payload: Uint8Array, version: number }>(
            ServerDataCacheStore.CatalogSchemas,
            'shop'
        )

        expect(record?.version).toBe(42)
        expect(Array.from(record?.payload ?? [])).toEqual([1, 2, 3])
    })

    test('reports a missing record as a miss', async () => {
        expect(await cache.get(ServerDataCacheStore.CatalogSchemas, 'missing')).toBeUndefined()
    })

    test('overwrites a record whole, so concurrent writers resolve to last-writer-wins', async () => {
        await cache.put(ServerDataCacheStore.CatalogSchemas, 'shop', { version: 1 })
        await cache.put(ServerDataCacheStore.CatalogSchemas, 'shop', { version: 2 })

        expect((await cache.get<{ version: number }>(ServerDataCacheStore.CatalogSchemas, 'shop'))?.version).toBe(2)
    })

    test('deletes a single record and tolerates deleting a missing one', async () => {
        await cache.put(ServerDataCacheStore.CatalogSchemas, 'shop', { version: 1 })

        await cache.delete(ServerDataCacheStore.CatalogSchemas, 'shop')
        await cache.delete(ServerDataCacheStore.CatalogSchemas, 'shop')

        expect(await cache.get(ServerDataCacheStore.CatalogSchemas, 'shop')).toBeUndefined()
    })
})

describe('prefix deletion', () => {
    test('deletes every record of a catalog and nothing of a similarly named one', async () => {
        await cache.put(ServerDataCacheStore.EntitySchemas, 'shop:Product', { version: 1 })
        await cache.put(ServerDataCacheStore.EntitySchemas, 'shop:Category', { version: 1 })
        // the key separator is what keeps this catalog out of it - evitaDB classifiers cannot contain a colon
        await cache.put(ServerDataCacheStore.EntitySchemas, 'shopArchive:Product', { version: 1 })

        await cache.deleteByPrefix(ServerDataCacheStore.EntitySchemas, 'shop:')

        expect(await cache.get(ServerDataCacheStore.EntitySchemas, 'shop:Product')).toBeUndefined()
        expect(await cache.get(ServerDataCacheStore.EntitySchemas, 'shop:Category')).toBeUndefined()
        expect(await cache.get(ServerDataCacheStore.EntitySchemas, 'shopArchive:Product')).not.toBeUndefined()
    })
})

describe('record limit', () => {
    /**
     * Writes records with explicit `storedAt` values, oldest first, so age is deterministic — the layer stamps
     * `Date.now()`, which is far too coarse to order writes made in the same millisecond.
     */
    async function putAged(keys: string[]): Promise<void> {
        for (let i = 0; i < keys.length; i++) {
            await cache.put(ServerDataCacheStore.EntitySchemas, keys[i]!, { version: 1, storedAt: 1000 + i })
        }
    }

    async function remainingKeys(): Promise<string[]> {
        const present: string[] = []
        for (const key of ['a', 'b', 'c', 'd', 'e']) {
            if (await cache.get(ServerDataCacheStore.EntitySchemas, key) != undefined) {
                present.push(key)
            }
        }
        return present
    }

    test('evicts the least recently written records down to the limit', async () => {
        await putAged(['a', 'b', 'c', 'd', 'e'])

        await cache.enforceRecordLimit(ServerDataCacheStore.EntitySchemas, 2)

        // 'a'..'c' are the oldest three and go; the two newest survive
        expect(await remainingKeys()).toEqual(['d', 'e'])
    })

    test('evicts by age of each record, not by its position among the keys', async () => {
        // written newest-first, so key order and age order disagree — pairing a key with somebody else's
        // timestamp (which is what zipping two separate reads by index did) evicts exactly the wrong records
        await putAged(['e', 'd', 'c', 'b', 'a'])

        await cache.enforceRecordLimit(ServerDataCacheStore.EntitySchemas, 2)

        expect(await remainingKeys()).toEqual(['a', 'b'])
    })

    test('leaves a store within its limit untouched', async () => {
        await putAged(['a', 'b'])

        await cache.enforceRecordLimit(ServerDataCacheStore.EntitySchemas, 5)

        expect(await remainingKeys()).toEqual(['a', 'b'])
    })

    test('brings a store back to its limit even when a record carries no timestamp', async () => {
        // no writer produces such a record any more (and an older format is abandoned wholesale), but one
        // would be absent from the age index and could otherwise pin the store over its cap forever
        await cache.put(ServerDataCacheStore.EntitySchemas, 'a', { version: 1 })
        await cache.put(ServerDataCacheStore.EntitySchemas, 'd', { version: 1 })
        await putAged(['b', 'c'])

        await cache.enforceRecordLimit(ServerDataCacheStore.EntitySchemas, 1)

        // the timestamped ones are still evicted oldest-first; the untimestamped surplus goes with them
        expect(await remainingKeys()).toHaveLength(1)
        expect(await cache.get(ServerDataCacheStore.EntitySchemas, 'b')).toBeUndefined()
        expect(await cache.get(ServerDataCacheStore.EntitySchemas, 'c')).toBeUndefined()
    })
})

describe('graceful degradation', () => {
    /** Runs the body with `indexedDB` removed from the environment, restoring it afterwards. */
    async function withoutIndexedDB(body: () => Promise<void>): Promise<void> {
        const indexedDBDescriptor: PropertyDescriptor | undefined =
            Object.getOwnPropertyDescriptor(globalThis, 'indexedDB')
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        Reflect.deleteProperty(globalThis as Record<string, unknown>, 'indexedDB')
        try {
            await body()
        } finally {
            if (indexedDBDescriptor != undefined) {
                Object.defineProperty(globalThis, 'indexedDB', indexedDBDescriptor)
            }
            warn.mockRestore()
        }
    }

    test('behaves as an empty cache when IndexedDB is unavailable', async () => {
        // a hardened browser profile with storage disabled; evitaLab must stay fully functional
        await withoutIndexedDB(async () => {
            const unusableCache: LabServerDataCache = new LabServerDataCache('http://localhost:5555')

            await unusableCache.put(ServerDataCacheStore.CatalogSchemas, 'shop', { version: 1 })

            expect(await unusableCache.get(ServerDataCacheStore.CatalogSchemas, 'shop')).toBeUndefined()
            await unusableCache.delete(ServerDataCacheStore.CatalogSchemas, 'shop')
            await unusableCache.deleteByPrefix(ServerDataCacheStore.EntitySchemas, 'shop:')
            await unusableCache.clear()
        })
    })

    test('reports itself unusable without waiting for anything to be read', async () => {
        // knowable synchronously, so the status bar can badge it from the first paint rather than after
        // whatever happens to read first
        await withoutIndexedDB(async () => {
            expect(new LabServerDataCache('http://localhost:5555').usable.value).toBe(false)
        })
    })

    test('reports a working cache as usable', () => {
        expect(cache.usable.value).toBe(true)
    })

    test('stops touching storage once it has been declared unusable', async () => {
        await withoutIndexedDB(async () => {
            const unusableCache: LabServerDataCache = new LabServerDataCache('http://localhost:5555')
            expect(unusableCache.usable.value).toBe(false)

            // restoring IndexedDB must not resurrect the cache: the latch is the whole point, and a browser
            // that refused storage once is not asked again for the lifetime of the page
            const restored: PropertyDescriptor | undefined =
                Object.getOwnPropertyDescriptor(globalThis, 'indexedDB')
            expect(restored).toBeUndefined()

            await unusableCache.put(ServerDataCacheStore.CatalogSchemas, 'shop', { version: 1 })
            expect(await unusableCache.get(ServerDataCacheStore.CatalogSchemas, 'shop')).toBeUndefined()
        })
    })

    test('reports an unopenable database once, not per operation', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const open = vi.spyOn(indexedDB, 'open').mockImplementation(() => {
            throw new DOMException('Storage is not allowed in this context.', 'SecurityError')
        })
        try {
            const refusedCache: LabServerDataCache = new LabServerDataCache('http://localhost:5555/refused')

            // the open only happens on first use, so the latch is not set until something is read
            expect(refusedCache.usable.value).toBe(true)
            await refusedCache.get(ServerDataCacheStore.CatalogSchemas, 'shop')
            expect(refusedCache.usable.value).toBe(false)

            const warningsAfterFirstFailure: number = warn.mock.calls.length
            await refusedCache.get(ServerDataCacheStore.CatalogSchemas, 'shop')
            await refusedCache.put(ServerDataCacheStore.CatalogSchemas, 'shop', { version: 1 })
            await refusedCache.delete(ServerDataCacheStore.CatalogSchemas, 'shop')

            expect(warn.mock.calls.length).toBe(warningsAfterFirstFailure)
        } finally {
            open.mockRestore()
            warn.mockRestore()
        }
    })

    /** Makes the next `count` writes fail with the error a full disk produces. See {@link loseConnection}. */
    function exceedQuota(target: LabServerDataCache, count: number): MockInstance {
        const openDatabase = vi.spyOn(
            target as unknown as { openDatabase(): Promise<unknown> },
            'openDatabase'
        )
        for (let i = 0; i < count; i++) {
            openDatabase.mockImplementationOnce(() => Promise.resolve({
                put: () => Promise.reject(new DOMException('Quota exceeded.', 'QuotaExceededError'))
            }))
        }
        return openDatabase
    }

    test('keeps caching when a single write hits the quota', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        try {
            await cache.put(ServerDataCacheStore.CatalogSchemas, 'small', { version: 1 })

            // a record too large for the quota must cost that record and nothing else - turning the whole cache
            // off for one oversized schema would be worse than keeping it
            const quotaExceeded: MockInstance = exceedQuota(cache, 1)
            await cache.put(ServerDataCacheStore.CatalogSchemas, 'huge', { version: 1 })
            quotaExceeded.mockRestore()

            expect(cache.usable.value).toBe(true)
            expect(await cache.get(ServerDataCacheStore.CatalogSchemas, 'small')).not.toBeUndefined()
            await cache.put(ServerDataCacheStore.CatalogSchemas, 'another', { version: 1 })
            expect(await cache.get(ServerDataCacheStore.CatalogSchemas, 'another')).not.toBeUndefined()
        } finally {
            warn.mockRestore()
        }
    })

    test('reports a persistently full store once, not on every write', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        try {
            // a full disk fails every write for as long as it lasts; warning per write would bury the console
            const quotaExceeded: MockInstance = exceedQuota(cache, 3)
            await cache.put(ServerDataCacheStore.CatalogSchemas, 'a', { version: 1 })
            await cache.put(ServerDataCacheStore.CatalogSchemas, 'b', { version: 1 })
            await cache.put(ServerDataCacheStore.CatalogSchemas, 'c', { version: 1 })

            expect(warn).toHaveBeenCalledTimes(1)
            expect(cache.usable.value).toBe(true)
            quotaExceeded.mockRestore()
        } finally {
            warn.mockRestore()
        }
    })

    test('reports the store again after it has recovered', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        try {
            const firstFailure: MockInstance = exceedQuota(cache, 1)
            await cache.put(ServerDataCacheStore.CatalogSchemas, 'a', { version: 1 })
            firstFailure.mockRestore()

            // a write that succeeds means the situation changed, so the next failure is news again
            await cache.put(ServerDataCacheStore.CatalogSchemas, 'b', { version: 1 })
            const secondFailure: MockInstance = exceedQuota(cache, 1)
            await cache.put(ServerDataCacheStore.CatalogSchemas, 'c', { version: 1 })

            expect(warn).toHaveBeenCalledTimes(2)
            secondFailure.mockRestore()
        } finally {
            warn.mockRestore()
        }
    })

    /**
     * Makes the next `count` operations fail as though the browser had closed the connection.
     *
     * @return the spy, so a test can restore exactly it — `vi.restoreAllMocks()` would take the `console.warn`
     *         spy with it and silently stop counting warnings
     */
    function loseConnection(target: LabServerDataCache, count: number): MockInstance {
        const openDatabase = vi.spyOn(
            target as unknown as { openDatabase(): Promise<unknown> },
            'openDatabase'
        )
        for (let i = 0; i < count; i++) {
            openDatabase.mockImplementationOnce(() => Promise.resolve({
                get: () => Promise.reject(
                    new DOMException('The database connection is closing.', 'InvalidStateError')
                )
            }))
        }
        return openDatabase
    }

    test('reopens a lost connection once and recovers', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        try {
            await cache.put(ServerDataCacheStore.CatalogSchemas, 'shop', { version: 1 })

            // the browser closed the connection underneath us; the record is still on disk, so a reopen
            // recovers it and the cache stays usable
            const lostConnection: MockInstance = loseConnection(cache, 1)
            expect(await cache.get(ServerDataCacheStore.CatalogSchemas, 'shop')).toBeUndefined()
            lostConnection.mockRestore()

            expect(cache.usable.value).toBe(true)
            expect(await cache.get(ServerDataCacheStore.CatalogSchemas, 'shop')).not.toBeUndefined()
        } finally {
            warn.mockRestore()
        }
    })

    test('still reopens when the browser also announces the closure', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        try {
            await cache.put(ServerDataCacheStore.CatalogSchemas, 'shop', { version: 1 })

            // one termination raises two signals: the browser's close event and the failure of whatever was in
            // flight. If both spent from the single-reopen budget, the first termination would latch storage off
            // without ever trying to reopen. (Called directly because fake-indexeddb cannot raise `close`.)
            ;(cache as unknown as { forgetConnection(): void }).forgetConnection()
            const lostConnection: MockInstance = loseConnection(cache, 1)
            await cache.get(ServerDataCacheStore.CatalogSchemas, 'shop')
            lostConnection.mockRestore()

            expect(cache.usable.value).toBe(true)
            expect(await cache.get(ServerDataCacheStore.CatalogSchemas, 'shop')).not.toBeUndefined()
        } finally {
            warn.mockRestore()
        }
    })

    test('gives up when the reopen loses the connection too', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        try {
            const dyingCache: LabServerDataCache = new LabServerDataCache('http://localhost:5555/dying')
            await dyingCache.put(ServerDataCacheStore.CatalogSchemas, 'shop', { version: 1 })

            // storage that keeps closing the connection is not merely under pressure; one retry is all it gets
            const lostConnection: MockInstance = loseConnection(dyingCache, 2)
            await dyingCache.get(ServerDataCacheStore.CatalogSchemas, 'shop')
            expect(dyingCache.usable.value).toBe(true)
            await dyingCache.get(ServerDataCacheStore.CatalogSchemas, 'shop')

            expect(dyingCache.usable.value).toBe(false)
            lostConnection.mockRestore()
        } finally {
            warn.mockRestore()
        }
    })
})
