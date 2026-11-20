import { describe, expect, test } from 'vitest'
import { RestOpenApiCache } from '@/modules/database-driver/RestOpenApiCache'
import { RestOpenApi } from '@/modules/database-driver/connector/rest/model/RestOpenApi'
import { RestInstanceType } from '@/modules/database-driver/connector/rest/model/RestInstanceType'
import { CacheInvalidationReason } from '@/modules/database-driver/cache/CacheInvalidationReason'

/**
 * Every open REST console of a catalog reloads its specification when the catalog schema changes. Without sharing
 * the load, N consoles meant N parallel downloads and parses of a several megabytes large document.
 */

/** A load the test resolves by hand. */
function deferredLoad(): { accessor: () => Promise<RestOpenApi>, calls: () => number, resolve: (openApi: RestOpenApi) => void } {
    let calls: number = 0
    let resolveLoad: (openApi: RestOpenApi) => void = () => {}
    const pending: Promise<RestOpenApi> = new Promise(resolve => { resolveLoad = resolve })
    return {
        accessor: async () => {
            calls++
            return await pending
        },
        calls: () => calls,
        resolve: (openApi: RestOpenApi) => resolveLoad(openApi)
    }
}

const v1: RestOpenApi = new RestOpenApi('hash-1', { info: { title: 'v1' } })
const v2: RestOpenApi = new RestOpenApi('hash-2', { info: { title: 'v2' } })

describe('REST OpenAPI cache', () => {
    test('Should share one load among concurrent readers', async () => {
        const cache: RestOpenApiCache = new RestOpenApiCache()
        const load = deferredLoad()

        const readers: Promise<RestOpenApi>[] = [1, 2, 3]
            .map(() => cache.getOpenApi('evita', RestInstanceType.Catalog, load.accessor))
        load.resolve(v1)

        expect(await Promise.all(readers)).toEqual([v1, v1, v1])
        expect(load.calls()).toBe(1)
        expect(cache.cachedSpecHash('evita', RestInstanceType.Catalog)).toBe('hash-1')
    })

    test('Should not resurrect a load that started before the entry was cleared', async () => {
        const cache: RestOpenApiCache = new RestOpenApiCache()
        const staleLoad = deferredLoad()
        const staleReader: Promise<RestOpenApi> = cache.getOpenApi('evita', RestInstanceType.Catalog, staleLoad.accessor)

        await cache.clear('evita', RestInstanceType.Catalog, CacheInvalidationReason.ChangeEvidence)
        // a reader after the clear does not join the stale load
        const freshLoad = deferredLoad()
        const freshReader: Promise<RestOpenApi> = cache.getOpenApi('evita', RestInstanceType.Catalog, freshLoad.accessor)
        freshLoad.resolve(v2)
        staleLoad.resolve(v1)

        expect(await freshReader).toBe(v2)
        expect(await staleReader).toBe(v1)
        expect(cache.cachedSpecHash('evita', RestInstanceType.Catalog)).toBe('hash-2')
    })

    test('Should not overwrite a refreshed specification with a load that started earlier', async () => {
        const cache: RestOpenApiCache = new RestOpenApiCache()
        const staleLoad = deferredLoad()
        const staleReader: Promise<RestOpenApi> = cache.getOpenApi('evita', RestInstanceType.Catalog, staleLoad.accessor)

        await cache.refresh('evita', RestInstanceType.Catalog, v2)
        staleLoad.resolve(v1)
        await staleReader

        expect(cache.cachedSpecHash('evita', RestInstanceType.Catalog)).toBe('hash-2')
    })

    test('Should drop loads in flight on a wholesale clear', async () => {
        const cache: RestOpenApiCache = new RestOpenApiCache()
        const staleLoad = deferredLoad()
        const staleReader: Promise<RestOpenApi> = cache.getOpenApi('system', RestInstanceType.System, staleLoad.accessor)

        await cache.clearAll(CacheInvalidationReason.MemoryOnly)
        staleLoad.resolve(v1)
        await staleReader

        expect(cache.cachedSpecHash('system', RestInstanceType.System)).toBeUndefined()
    })
})
