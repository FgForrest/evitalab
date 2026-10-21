import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { SymbolSearchService } from '@/modules/symbol-search/service/SymbolSearchService'
import { SymbolIndexBuilder } from '@/modules/symbol-search/service/SymbolIndexBuilder'
import type { SymbolActionExecutor } from '@/modules/symbol-search/service/SymbolActionExecutor'
import { SymbolIndexStatus } from '@/modules/symbol-search/model/SymbolIndexState'
import { SymbolType } from '@/modules/symbol-search/model/SymbolType'
import type { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import type { Toaster } from '@/modules/notification/service/Toaster'
import {
    type ScriptedCatalog,
    ScriptedClient,
    ScriptedEvitaServer,
    flushTasks
} from './scriptedEvitaServer'

let providerName: string

beforeEach(() => {
    providerName = `http://localhost:5555/${Math.random()}`
    // the scripted server has no server status, the GraphQL consoles are simply disabled
    vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
    vi.restoreAllMocks()
})

function catalog(name: string, productAttribute: string = 'code'): ScriptedCatalog {
    return {
        name,
        attributes: ['url'],
        entities: [
            { name: 'product', attributes: [productAttribute, 'name'], references: [{ name: 'brand', attributes: ['order'] }] },
            { name: 'brand', attributes: ['code'] }
        ]
    }
}

/** Waits past the rebuild debounce of the service and for the rebuild it triggers. */
async function settleRebuilds(): Promise<void> {
    for (let i = 0; i < 3; i++) {
        await flushTasks()
        await new Promise<void>(resolve => setTimeout(resolve, 80))
    }
    await flushTasks()
}

class Fixture {
    readonly server: ScriptedEvitaServer
    readonly client: ScriptedClient
    readonly toaster: { error: ReturnType<typeof vi.fn> }
    readonly service: SymbolSearchService
    readonly builds: string[] = []

    constructor(catalogs: ScriptedCatalog[], symbolLimit?: number) {
        this.server = new ScriptedEvitaServer(catalogs)
        this.client = new ScriptedClient(this.server, providerName)
        this.toaster = { error: vi.fn(async () => {}) }
        this.service = new SymbolSearchService(
            this.client.client,
            { getDisabledReason: () => undefined, execute: () => {} } as unknown as SymbolActionExecutor,
            this.toaster as unknown as Toaster,
            symbolLimit
        )
        const original = SymbolIndexBuilder.prototype.buildPartition
        const builds: string[] = this.builds
        vi.spyOn(SymbolIndexBuilder.prototype, 'buildPartition').mockImplementation(async function (this: SymbolIndexBuilder, catalog: CatalogStatistics) {
            builds.push(catalog.name)
            return await original.call(this, catalog)
        })
    }

    count(query: string): number {
        return this.service.search(query).totalCount
    }

    async openAndBuild(): Promise<void> {
        this.service.open()
        await this.service.ensureIndex()
        await settleRebuilds()
    }
}

describe('building', () => {
    test('Should build the index lazily on the first open', async () => {
        const fixture: Fixture = new Fixture([catalog('evita'), catalog('staging')])
        expect(fixture.service.state.value.status).toBe(SymbolIndexStatus.Idle)
        expect(fixture.server.calls).toEqual({})

        await fixture.openAndBuild()

        expect(fixture.service.state.value.status).toBe(SymbolIndexStatus.Ready)
        expect(fixture.service.state.value.symbolCount).toBe(18)
        // brand.code and product.code in both catalogs
        expect(fixture.count('code')).toBe(4)
        expect(fixture.service.search('staging').results[0]?.symbol.type).toBe(SymbolType.Catalog)
    })

    test('Should share one build between concurrent callers', async () => {
        const fixture: Fixture = new Fixture([catalog('evita'), catalog('staging')])
        fixture.service.open()
        const first: Promise<void> = fixture.service.ensureIndex()
        const second: Promise<void> = fixture.service.ensureIndex()
        expect(second).toBe(first)
        await first
        await settleRebuilds()

        expect(fixture.builds).toEqual(['evita', 'staging'])
        expect(fixture.server.calls.getCatalogSchema).toBe(2)
    })

    test('Should not rebuild anything on a reopen when nothing changed', async () => {
        const fixture: Fixture = new Fixture([catalog('evita')])
        await fixture.openAndBuild()
        fixture.service.close()

        await fixture.openAndBuild()

        expect(fixture.builds).toEqual(['evita'])
    })

    test('Should keep a failing catalog searchable by its name and index the others', async () => {
        const fixture: Fixture = new Fixture([catalog('broken'), catalog('evita')])
        fixture.server.beforeSchemaServed = async (catalogName: string) => {
            if (catalogName === 'broken') {
                throw new Error('Cannot read the schema.')
            }
        }

        await fixture.openAndBuild()

        expect(fixture.service.search('broken').totalCount).toBe(1)
        expect(fixture.count('code')).toBe(2)
        expect(fixture.toaster.error).not.toHaveBeenCalled()
    })

    test('Should report a failed build when not even the catalog listing can be read', async () => {
        const fixture: Fixture = new Fixture([catalog('evita')])
        fixture.server.unreachable = true

        await fixture.openAndBuild()

        expect(fixture.service.state.value.status).toBe(SymbolIndexStatus.Failed)
        expect(fixture.toaster.error).toHaveBeenCalledTimes(1)
    })

    test('Should stop indexing at the symbol limit in catalog name order', async () => {
        // every catalog has 9 symbols
        const fixture: Fixture = new Fixture([catalog('c'), catalog('a'), catalog('b')], 20)

        await fixture.openAndBuild()

        expect(fixture.service.state.value.status).toBe(SymbolIndexStatus.LimitExceeded)
        expect(fixture.service.state.value.truncatedCatalogs).toBe(1)
        expect(fixture.service.state.value.symbolCount).toBe(18)
        expect(fixture.service.search('c').results.some(it => it.symbol.type === SymbolType.Catalog && it.symbol.name === 'c')).toBe(false)
    })
})

describe('freshness', () => {
    test('Should not rebuild a catalog left out at the symbol limit on every statistics change', async () => {
        const fixture: Fixture = new Fixture([catalog('a'), catalog('b'), catalog('c')], 21)
        await fixture.openAndBuild()
        expect(fixture.builds).toEqual(['a', 'b', 'c'])

        // data commits only
        fixture.server.catalog('a').catalogVersion = 2
        await fixture.client.client.management.refreshCatalogStatistics()
        await settleRebuilds()
        fixture.server.catalog('b').catalogVersion = 2
        await fixture.client.client.management.refreshCatalogStatistics()
        await settleRebuilds()
        expect(fixture.builds).toEqual(['a', 'b', 'c'])
        expect(fixture.service.state.value.status).toBe(SymbolIndexStatus.LimitExceeded)

        // a structural change of the left-out catalog is looked at again
        // shrinks to 3 symbols (catalog, its attribute, the collection), which fits next to the 18 of `a` and `b`
        fixture.server.catalog('c').entities = [{ name: 'tag' }]
        await fixture.client.client.management.refreshCatalogStatistics()
        await settleRebuilds()
        expect(fixture.builds).toEqual(['a', 'b', 'c', 'c'])
        expect(fixture.service.state.value.status).toBe(SymbolIndexStatus.Ready)
        expect(fixture.count('tag')).toBe(1)
    })

    test('Should replace a renamed attribute after an entity schema change', async () => {
        const fixture: Fixture = new Fixture([catalog('evita', 'oldName')])
        await fixture.openAndBuild()
        expect(fixture.count('oldName')).toBe(1)

        // somebody renames the attribute; only the entity-level callbacks fire for it
        const product = fixture.server.entity('evita', 'product')
        product.attributes = ['newName', 'name']
        product.version = 2
        await fixture.client.client.refreshEntitySchema('evita', 'product')
        await settleRebuilds()

        expect(fixture.count('oldName')).toBe(0)
        expect(fixture.count('newName')).toBe(1)
    })

    test('Should not rebuild on a catalog version bump without structural change', async () => {
        const fixture: Fixture = new Fixture([catalog('evita')])
        await fixture.openAndBuild()

        // a data commit: the listing identity changes, so the statistics callbacks fire
        fixture.server.catalog('evita').catalogVersion = 2
        expect(await fixture.client.client.management.refreshCatalogStatistics()).toBe(true)
        await settleRebuilds()

        expect(fixture.builds).toEqual(['evita'])
    })

    test('Should index a newly created collection', async () => {
        const fixture: Fixture = new Fixture([catalog('evita')])
        await fixture.openAndBuild()
        expect(fixture.count('tag')).toBe(0)

        // creating a collection fires no schema callback, only the statistics change
        fixture.server.catalog('evita').entities?.push({ name: 'tag', attributes: ['isPublic'] })
        await fixture.client.client.management.refreshCatalogStatistics()
        await settleRebuilds()

        expect(fixture.service.search('tag').results.map(it => it.symbol.type)).toEqual([SymbolType.EntityCollection])
        expect(fixture.count('isPublic')).toBe(1)
    })

    test('Should rebuild exactly once after a catalog-wide invalidation', async () => {
        const fixture: Fixture = new Fixture([catalog('evita')])
        await fixture.openAndBuild()

        // notifies the catalog listener and every entity listener of the catalog
        await fixture.client.client.clearSchemaCache('evita')
        await settleRebuilds()

        expect(fixture.builds).toEqual(['evita', 'evita'])
    })

    test('Should keep its schema listeners registered across rebuilds and only add new entity types', async () => {
        const fixture: Fixture = new Fixture([catalog('evita')])
        const registerCatalog = vi.spyOn(fixture.client.client, 'registerCatalogSchemaChangedCallback')
        const registerEntity = vi.spyOn(fixture.client.client, 'registerEntitySchemaChangedCallback')
        const unregisterCatalog = vi.spyOn(fixture.client.client, 'unregisterCatalogSchemaChangedCallback')
        const unregisterEntity = vi.spyOn(fixture.client.client, 'unregisterEntitySchemaChangedCallback')
        await fixture.openAndBuild()
        expect(registerCatalog).toHaveBeenCalledTimes(1)
        expect(registerEntity).toHaveBeenCalledTimes(2)

        // a rebuild must not churn the listener lists other tabs are being notified from
        await fixture.client.client.clearSchemaCache('evita')
        await settleRebuilds()
        fixture.server.catalog('evita').entities?.push({ name: 'tag', attributes: ['isPublic'] })
        await fixture.client.client.management.refreshCatalogStatistics()
        await settleRebuilds()

        expect(fixture.builds).toEqual(['evita', 'evita', 'evita'])
        expect(registerCatalog).toHaveBeenCalledTimes(1)
        expect(registerEntity).toHaveBeenCalledTimes(3)
        expect(registerEntity).toHaveBeenLastCalledWith('evita', 'tag', expect.any(Function))
        expect(unregisterCatalog).not.toHaveBeenCalled()
        expect(unregisterEntity).not.toHaveBeenCalled()
    })

    test('Should not make another tab miss a schema change while it rebuilds', async () => {
        const fixture: Fixture = new Fixture([catalog('evita', 'oldName')])
        await fixture.openAndBuild()
        // two tabs listening after the symbol search; the first one re-reads the schema from its callback
        const tabB = vi.fn(async () => {})
        fixture.client.client.registerEntitySchemaChangedCallback('evita', 'product', async () => {
            await new Promise<void>(resolve => setTimeout(resolve, 120))
        })
        fixture.client.client.registerEntitySchemaChangedCallback('evita', 'product', tabB)

        const product = fixture.server.entity('evita', 'product')
        product.attributes = ['newName', 'name']
        product.version = 2
        await fixture.client.client.refreshEntitySchema('evita', 'product')
        await settleRebuilds()

        expect(tabB).toHaveBeenCalledTimes(1)
        expect(fixture.count('newName')).toBe(1)
    })

    test('Should drop a vanished catalog and unregister its listeners', async () => {
        const fixture: Fixture = new Fixture([catalog('evita'), catalog('staging')])
        await fixture.openAndBuild()
        const unregister = vi.spyOn(fixture.client.client, 'unregisterCatalogSchemaChangedCallback')

        fixture.server.catalogs = fixture.server.catalogs.filter(it => it.name !== 'staging')
        await fixture.client.client.management.refreshCatalogStatistics()
        await settleRebuilds()

        expect(fixture.count('staging')).toBe(0)
        expect(fixture.count('code')).toBe(2)
        expect(unregister).toHaveBeenCalledWith('staging', expect.any(String))
        expect(fixture.service.state.value.symbolCount).toBe(9)
    })

    test('Should postpone rebuilds until the popup is opened again', async () => {
        const fixture: Fixture = new Fixture([catalog('evita', 'oldName')])
        await fixture.openAndBuild()
        fixture.service.close()

        const product = fixture.server.entity('evita', 'product')
        product.attributes = ['newName', 'name']
        product.version = 2
        await fixture.client.client.refreshEntitySchema('evita', 'product')
        await settleRebuilds()
        expect(fixture.builds).toEqual(['evita'])
        // the stale partition stays searchable meanwhile
        expect(fixture.count('oldName')).toBe(1)

        await fixture.openAndBuild()
        expect(fixture.builds).toEqual(['evita', 'evita'])
        expect(fixture.count('newName')).toBe(1)
    })

    test('Should discard a build superseded by a change of its catalog', async () => {
        const fixture: Fixture = new Fixture([catalog('evita', 'oldName')])
        let changed: boolean = false
        fixture.server.beforeSchemaServed = async (_catalogName: string, entityType?: string) => {
            // product has been read already when brand is requested - change product under the running build
            if (entityType === 'brand' && !changed) {
                changed = true
                const product = fixture.server.entity('evita', 'product')
                product.attributes = ['newName', 'name']
                product.version = 2
                await fixture.client.client.refreshEntitySchema('evita', 'product')
            }
        }

        fixture.service.open()
        await fixture.service.ensureIndex()
        // the stale result was never published
        expect(fixture.count('oldName')).toBe(0)

        await settleRebuilds()
        expect(fixture.builds).toEqual(['evita', 'evita'])
        expect(fixture.count('oldName')).toBe(0)
        expect(fixture.count('newName')).toBe(1)
    })
})
