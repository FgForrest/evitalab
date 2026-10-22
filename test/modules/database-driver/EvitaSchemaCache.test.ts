import { describe, test, expect, vi } from 'vitest'
import { EvitaSchemaCache } from '../../../src/modules/database-driver/EvitaSchemaCache'
import { EntitySchema } from '../../../src/modules/database-driver/request-response/schema/EntitySchema'
import { CacheInvalidationReason } from '../../../src/modules/database-driver/cache/CacheInvalidationReason'
import { CatalogSchema } from '../../../src/modules/database-driver/request-response/schema/CatalogSchema'

// the cache only stores and hands back what the accessor returns, so a stub is enough here
function entitySchema(name: string): EntitySchema {
    return { name } as unknown as EntitySchema
}

describe('EvitaSchemaCache entity schema change notification', () => {

    test('a catalog listener re-reading the catalog schema does not break the entity schema cascade', async () => {
        // an open catalog schema tab (or the symbol index) reloads the catalog schema from its callback, which
        // puts the catalog schema back into the cache before the cascade to the entity schemas walks its keys
        const cache = new EvitaSchemaCache()
        const catalogAccessor = vi.fn(async () => ({ name: 'evita' }) as unknown as CatalogSchema)
        cache.registerCatalogSchemaChangedCallback(async () => {
            await cache.getLatestCatalogSchema(catalogAccessor)
        })
        const entityCallback = vi.fn(async () => {})
        cache.registerEntitySchemaChangedCallback('Product', entityCallback)
        await cache.getLatestEntitySchema('Product', async () => entitySchema('Product'))

        await cache.removeLatestCatalogSchema(CacheInvalidationReason.ChangeEvidence)

        expect(catalogAccessor).toHaveBeenCalledTimes(1)
        expect(entityCallback).toHaveBeenCalledTimes(1)
    })

    test('a listener is notified even when its schema is not currently cached', async () => {
        // this is the state an open tab is in right after a previous change evicted its schema and the
        // reload has not completed yet; a change arriving in that window must still reach the listener
        const cache = new EvitaSchemaCache()
        const callback = vi.fn(async () => {})
        cache.registerEntitySchemaChangedCallback('Product', callback)

        await cache.removeLatestCatalogSchema(CacheInvalidationReason.ChangeEvidence)

        expect(callback).toHaveBeenCalledTimes(1)
    })

    test('a cached schema is evicted and its listener notified', async () => {
        const cache = new EvitaSchemaCache()
        const callback = vi.fn(async () => {})
        cache.registerEntitySchemaChangedCallback('Product', callback)

        const accessor = vi.fn(async () => entitySchema('Product'))
        await cache.getLatestEntitySchema('Product', accessor)
        expect(accessor).toHaveBeenCalledTimes(1)

        await cache.removeLatestCatalogSchema(CacheInvalidationReason.ChangeEvidence)

        expect(callback).toHaveBeenCalledTimes(1)
        // the schema is gone from the cache, so the next read fetches again
        await cache.getLatestEntitySchema('Product', accessor)
        expect(accessor).toHaveBeenCalledTimes(2)
    })

    test('cached entity types without listeners are still evicted', async () => {
        const cache = new EvitaSchemaCache()
        const accessor = vi.fn(async () => entitySchema('Category'))
        await cache.getLatestEntitySchema('Category', accessor)

        await cache.removeLatestCatalogSchema(CacheInvalidationReason.ChangeEvidence)

        await cache.getLatestEntitySchema('Category', accessor)
        expect(accessor).toHaveBeenCalledTimes(2)
    })

    test('a targeted eviction touches only the requested entity type', async () => {
        const cache = new EvitaSchemaCache()
        const productAccessor = vi.fn(async () => entitySchema('Product'))
        const categoryAccessor = vi.fn(async () => entitySchema('Category'))
        const productCallback = vi.fn(async () => {})
        const categoryCallback = vi.fn(async () => {})
        cache.registerEntitySchemaChangedCallback('Product', productCallback)
        cache.registerEntitySchemaChangedCallback('Category', categoryCallback)
        await cache.getLatestEntitySchema('Product', productAccessor)
        await cache.getLatestEntitySchema('Category', categoryAccessor)

        await cache.removeLatestEntitySchema(CacheInvalidationReason.ChangeEvidence, 'Product')

        expect(productCallback).toHaveBeenCalledTimes(1)
        expect(categoryCallback).not.toHaveBeenCalled()
        // Product is gone from the cache and refetches; Category is untouched and still served from it
        await cache.getLatestEntitySchema('Product', productAccessor)
        await cache.getLatestEntitySchema('Category', categoryAccessor)
        expect(productAccessor).toHaveBeenCalledTimes(2)
        expect(categoryAccessor).toHaveBeenCalledTimes(1)
    })

    test('a catalog-wide eviction drops every cached entity schema exactly once', async () => {
        const cache = new EvitaSchemaCache()
        const productAccessor = vi.fn(async () => entitySchema('Product'))
        const categoryAccessor = vi.fn(async () => entitySchema('Category'))
        await cache.getLatestEntitySchema('Product', productAccessor)
        await cache.getLatestEntitySchema('Category', categoryAccessor)
        const productCallback = vi.fn(async () => {})
        cache.registerEntitySchemaChangedCallback('Product', productCallback)

        await cache.removeLatestCatalogSchema(CacheInvalidationReason.ChangeEvidence)

        // the listener is notified once, not once per cache key
        expect(productCallback).toHaveBeenCalledTimes(1)
        await cache.getLatestEntitySchema('Product', productAccessor)
        await cache.getLatestEntitySchema('Category', categoryAccessor)
        expect(productAccessor).toHaveBeenCalledTimes(2)
        expect(categoryAccessor).toHaveBeenCalledTimes(2)
    })

    test('notifying a listener whose schema is uncached does not disturb other cached schemas', async () => {
        const cache = new EvitaSchemaCache()
        const categoryAccessor = vi.fn(async () => entitySchema('Category'))
        await cache.getLatestEntitySchema('Category', categoryAccessor)
        // Product is listened to but was never fetched
        const productCallback = vi.fn(async () => {})
        cache.registerEntitySchemaChangedCallback('Product', productCallback)

        await cache.removeLatestEntitySchema(CacheInvalidationReason.ChangeEvidence, 'Product')

        expect(productCallback).toHaveBeenCalledTimes(1)
        // the targeted eviction of an uncached type must not evict Category
        await cache.getLatestEntitySchema('Category', categoryAccessor)
        expect(categoryAccessor).toHaveBeenCalledTimes(1)
    })

    test('an unregistered listener is no longer notified', async () => {
        const cache = new EvitaSchemaCache()
        const callback = vi.fn(async () => {})
        const id = cache.registerEntitySchemaChangedCallback('Product', callback)
        cache.unregisterEntitySchemaChangedCallback('Product', id)

        await cache.removeLatestCatalogSchema(CacheInvalidationReason.ChangeEvidence)

        expect(callback).not.toHaveBeenCalled()
    })
})

describe('EvitaSchemaCache callback dispatch', () => {

    test('a catalog listener re-registering itself mid-dispatch does not make later listeners miss the change', async () => {
        const cache = new EvitaSchemaCache()
        let selfId: string = ''
        const self = async (): Promise<void> => {
            cache.unregisterCatalogSchemaChangedCallback(selfId)
            selfId = cache.registerCatalogSchemaChangedCallback(self)
        }
        selfId = cache.registerCatalogSchemaChangedCallback(self)
        const tabA = vi.fn(async () => {})
        const tabB = vi.fn(async () => {})
        cache.registerCatalogSchemaChangedCallback(tabA)
        cache.registerCatalogSchemaChangedCallback(tabB)

        await cache.removeLatestCatalogSchema(CacheInvalidationReason.MemoryOnly)

        expect(tabA).toHaveBeenCalledTimes(1)
        expect(tabB).toHaveBeenCalledTimes(1)
    })

    test('an entity listener unregistering itself mid-dispatch does not make later listeners miss the change', async () => {
        const cache = new EvitaSchemaCache()
        let selfId: string = ''
        selfId = cache.registerEntitySchemaChangedCallback('Product', async () => {
            cache.unregisterEntitySchemaChangedCallback('Product', selfId)
        })
        const tabA = vi.fn(async () => {})
        const tabB = vi.fn(async () => {})
        cache.registerEntitySchemaChangedCallback('Product', tabA)
        cache.registerEntitySchemaChangedCallback('Product', tabB)

        await cache.removeLatestEntitySchema(CacheInvalidationReason.MemoryOnly, 'Product')

        expect(tabA).toHaveBeenCalledTimes(1)
        expect(tabB).toHaveBeenCalledTimes(1)
    })
})

