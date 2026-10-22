import { describe, expect, test, vi } from 'vitest'
import { GraphQLSchemaCache } from '@/modules/database-driver/GraphQLSchemaCache'
import { GraphQLInstanceType } from '@/modules/graphql-console/console/model/GraphQLInstanceType'
import { CacheInvalidationReason } from '@/modules/database-driver/cache/CacheInvalidationReason'

describe('GraphQLSchemaCache callback dispatch', () => {

    test('a listener unregistering itself mid-dispatch does not make later listeners miss the change', async () => {
        const cache = new GraphQLSchemaCache()
        let selfId: string = ''
        selfId = cache.registerGraphQLSchemaChangedCallback('evita', GraphQLInstanceType.Data, async () => {
            cache.unregisterGraphQLSchemaChangedCallback('evita', GraphQLInstanceType.Data, selfId)
        })
        const tabA = vi.fn(async () => {})
        const tabB = vi.fn(async () => {})
        cache.registerGraphQLSchemaChangedCallback('evita', GraphQLInstanceType.Data, tabA)
        cache.registerGraphQLSchemaChangedCallback('evita', GraphQLInstanceType.Data, tabB)

        await cache.clear('evita', GraphQLInstanceType.Data, CacheInvalidationReason.MemoryOnly)

        expect(tabA).toHaveBeenCalledTimes(1)
        expect(tabB).toHaveBeenCalledTimes(1)
    })
})
