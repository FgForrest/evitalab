import { beforeEach, describe, expect, test } from 'vitest'
import { SymbolIndexBuilder } from '@/modules/symbol-search/service/SymbolIndexBuilder'
import type { CatalogSymbolPartition } from '@/modules/symbol-search/service/CatalogSymbolPartition'
import { SymbolType } from '@/modules/symbol-search/model/SymbolType'
import { AttributeOwner } from '@/modules/symbol-search/model/AttributeOwner'
import type { SchemaSymbol } from '@/modules/symbol-search/model/SchemaSymbol'
import type { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import { GrpcCatalogState } from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb'
import {
    type ScriptedCatalog,
    ScriptedClient,
    ScriptedEvitaServer,
    flushTasks,
    settle
} from './scriptedEvitaServer'

let providerName: string

beforeEach(() => {
    providerName = `http://localhost:5555/${Math.random()}`
})

const evita: ScriptedCatalog = {
    name: 'evita',
    attributes: ['code', 'url'],
    entities: [
        {
            name: 'product',
            attributes: ['code', 'name'],
            compounds: ['codeAndName'],
            associatedData: ['gallery'],
            references: [
                { name: 'brand', attributes: ['order'], compounds: ['orderAndName'] }
            ]
        },
        { name: 'brand', attributes: ['code'] }
    ]
}

function symbols(partition: CatalogSymbolPartition): string[] {
    const all: Set<SchemaSymbol> = new Set()
    for (const key of partition.keys) {
        key.symbols.forEach(symbol => all.add(symbol))
    }
    return Array.from(all)
        .map(symbol => `${symbol.type}${symbol.attributeOwner != undefined ? `(${symbol.attributeOwner})` : ''}:${symbol.displayPath.join('/')}/${symbol.name}`)
        .sort()
}

async function catalog(builder: SymbolIndexBuilder, name: string): Promise<CatalogStatistics> {
    const result: CatalogStatistics | undefined = (await builder.getCatalogs()).find(it => it.name === name)
    if (result == undefined) {
        throw new Error(`No catalog ${name}.`)
    }
    return result
}

describe('walking the schema tree', () => {
    test('Should index every kind of schema item of a catalog', async () => {
        const client: ScriptedClient = new ScriptedClient(new ScriptedEvitaServer([evita]), providerName)
        const builder: SymbolIndexBuilder = new SymbolIndexBuilder(client.client)

        const partition: CatalogSymbolPartition = await builder.buildPartition(await catalog(builder, 'evita'))

        expect(symbols(partition)).toEqual([
            `${SymbolType.AssociatedData}:evita/product/gallery`,
            `${SymbolType.Attribute}(${AttributeOwner.Catalog}):evita/code`,
            `${SymbolType.Attribute}(${AttributeOwner.Catalog}):evita/url`,
            `${SymbolType.Attribute}(${AttributeOwner.Entity}):evita/brand/code`,
            `${SymbolType.Attribute}(${AttributeOwner.Entity}):evita/product/code`,
            `${SymbolType.Attribute}(${AttributeOwner.Entity}):evita/product/name`,
            `${SymbolType.Attribute}(${AttributeOwner.Reference}):evita/product/brand/order`,
            `${SymbolType.Catalog}:/evita`,
            `${SymbolType.EntityCollection}:evita/brand`,
            `${SymbolType.EntityCollection}:evita/product`,
            `${SymbolType.Reference}:evita/product/brand`,
            `${SymbolType.SortableAttributeCompound}(${AttributeOwner.Entity}):evita/product/codeAndName`,
            `${SymbolType.SortableAttributeCompound}(${AttributeOwner.Reference}):evita/product/brand/orderAndName`
        ])
        expect(partition.symbolCount).toBe(13)
    })

    test('Should index name variants as keys of the same symbol', async () => {
        const client: ScriptedClient = new ScriptedClient(new ScriptedEvitaServer([evita]), providerName)
        const builder: SymbolIndexBuilder = new SymbolIndexBuilder(client.client)

        const partition: CatalogSymbolPartition = await builder.buildPartition(await catalog(builder, 'evita'))

        // CODE_AND_NAME, code-and-name, … all collapse into one key
        expect(partition.getKey('codeandname')?.symbols.length).toBe(1)
    })

    test('Should index only the catalog symbol of a corrupted or inactive catalog and open no session', async () => {
        const server: ScriptedEvitaServer = new ScriptedEvitaServer([
            { ...evita, name: 'broken', state: GrpcCatalogState.CORRUPTED, unusable: true },
            { ...evita, name: 'sleeping', state: GrpcCatalogState.INACTIVE }
        ])
        const builder: SymbolIndexBuilder = new SymbolIndexBuilder(new ScriptedClient(server, providerName).client)

        expect(symbols(await builder.buildPartition(await catalog(builder, 'broken')))).toEqual([`${SymbolType.Catalog}:/broken`])
        expect(symbols(await builder.buildPartition(await catalog(builder, 'sleeping')))).toEqual([`${SymbolType.Catalog}:/sleeping`])
        expect(server.calls.createSession).toBeUndefined()
        expect(server.calls.getCatalogSchema).toBeUndefined()
    })

    test('Should index a warming-up catalog', async () => {
        const server: ScriptedEvitaServer = new ScriptedEvitaServer([{ ...evita, state: GrpcCatalogState.WARMING_UP }])
        const builder: SymbolIndexBuilder = new SymbolIndexBuilder(new ScriptedClient(server, providerName).client)

        expect((await builder.buildPartition(await catalog(builder, 'evita'))).symbolCount).toBe(13)
    })

    test('Should close the shared session of a warming-up catalog after reading it', async () => {
        // evitaDB permits a single session on a warming-up catalog, a pinned one would block schema mutations
        const server: ScriptedEvitaServer = new ScriptedEvitaServer([
            { ...evita, state: GrpcCatalogState.WARMING_UP },
            { ...evita, name: 'alive' }
        ])
        const builder: SymbolIndexBuilder = new SymbolIndexBuilder(new ScriptedClient(server, providerName).client)

        await builder.buildPartition(await catalog(builder, 'evita'))
        await flushTasks()
        expect(server.calls.createSession).toBe(1)
        expect(server.calls.closeSession).toBe(1)

        // an alive catalog keeps its shared read-only session for reuse
        await builder.buildPartition(await catalog(builder, 'alive'))
        await flushTasks()
        expect(server.calls.createSession).toBe(2)
        expect(server.calls.closeSession).toBe(1)
    })

    test('Should order catalogs by name', async () => {
        const server: ScriptedEvitaServer = new ScriptedEvitaServer([{ name: 'zeta' }, { name: 'alpha' }, { name: 'mid' }])
        const builder: SymbolIndexBuilder = new SymbolIndexBuilder(new ScriptedClient(server, providerName).client)

        expect((await builder.getCatalogs()).map(it => it.name)).toEqual(['alpha', 'mid', 'zeta'])
    })
})

describe('cached builds', () => {
    test('Should build from the persistent cache without entity type listing and without the server', async () => {
        const server: ScriptedEvitaServer = new ScriptedEvitaServer([evita])
        const firstRun: SymbolIndexBuilder = new SymbolIndexBuilder(new ScriptedClient(server, providerName).client)
        await firstRun.buildPartition(await catalog(firstRun, 'evita'))
        await flushTasks()
        expect(server.calls.getAllEntityTypes).toBeUndefined()

        // the lab is reloaded while the server is down
        server.unreachable = true
        const secondRun: SymbolIndexBuilder = new SymbolIndexBuilder(new ScriptedClient(server, providerName).client)
        const partition: CatalogSymbolPartition = await secondRun.buildPartition(await catalog(secondRun, 'evita'))

        expect(partition.symbolCount).toBe(13)
    })

    test('Should build from memory without any server call', async () => {
        const server: ScriptedEvitaServer = new ScriptedEvitaServer([evita])
        const builder: SymbolIndexBuilder = new SymbolIndexBuilder(new ScriptedClient(server, providerName).client)
        await builder.buildPartition(await catalog(builder, 'evita'))
        await settle()
        server.resetCalls()

        await builder.buildPartition(await catalog(builder, 'evita'))
        await settle()

        expect(server.calls).toEqual({})
    })
})
