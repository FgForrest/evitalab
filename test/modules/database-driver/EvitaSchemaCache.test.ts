import { describe, test, expect, vi } from 'vitest'
import { EvitaSchemaCache } from '../../../src/modules/database-driver/EvitaSchemaCache'
import { EntitySchema } from '../../../src/modules/database-driver/request-response/schema/EntitySchema'

// the cache only stores and hands back what the accessor returns, so a stub is enough here
function entitySchema(name: string): EntitySchema {
    return { name } as unknown as EntitySchema
}

describe('EvitaSchemaCache entity schema change notification', () => {

    test('a listener is notified even when its schema is not currently cached', async () => {
        // this is the state an open tab is in right after a previous change evicted its schema and the
        // reload has not completed yet; a change arriving in that window must still reach the listener
        const cache = new EvitaSchemaCache()
        const callback = vi.fn(async () => {})
        cache.registerEntitySchemaChangedCallback('Product', callback)

        await cache.removeLatestCatalogSchema()

        expect(callback).toHaveBeenCalledTimes(1)
    })

    test('a cached schema is evicted and its listener notified', async () => {
        const cache = new EvitaSchemaCache()
        const callback = vi.fn(async () => {})
        cache.registerEntitySchemaChangedCallback('Product', callback)

        const accessor = vi.fn(async () => entitySchema('Product'))
        await cache.getLatestEntitySchema('Product', accessor)
        expect(accessor).toHaveBeenCalledTimes(1)

        await cache.removeLatestCatalogSchema()

        expect(callback).toHaveBeenCalledTimes(1)
        // the schema is gone from the cache, so the next read fetches again
        await cache.getLatestEntitySchema('Product', accessor)
        expect(accessor).toHaveBeenCalledTimes(2)
    })

    test('cached entity types without listeners are still evicted', async () => {
        const cache = new EvitaSchemaCache()
        const accessor = vi.fn(async () => entitySchema('Category'))
        await cache.getLatestEntitySchema('Category', accessor)

        await cache.removeLatestCatalogSchema()

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

        await cache.removeLatestEntitySchema('Product')

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

        await cache.removeLatestCatalogSchema()

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

        await cache.removeLatestEntitySchema('Product')

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

        await cache.removeLatestCatalogSchema()

        expect(callback).not.toHaveBeenCalled()
    })
})
