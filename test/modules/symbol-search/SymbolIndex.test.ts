import { describe, expect, test } from 'vitest'
import { SymbolIndex } from '@/modules/symbol-search/service/SymbolIndex'
import { CatalogSymbolPartition } from '@/modules/symbol-search/service/CatalogSymbolPartition'
import { SchemaSymbol } from '@/modules/symbol-search/model/SchemaSymbol'
import { SymbolType } from '@/modules/symbol-search/model/SymbolType'
import { SymbolPath } from '@/modules/symbol-search/model/SymbolPath'
import { AttributeOwner } from '@/modules/symbol-search/model/AttributeOwner'
import type { SymbolSearchResults } from '@/modules/symbol-search/model/SymbolSearchResults'
import { MatchTier } from '@/modules/symbol-search/model/MatchTier'

function attribute(catalogName: string, entityType: string, name: string): SchemaSymbol {
    return new SchemaSymbol(SymbolType.Attribute, name, new SymbolPath(catalogName, entityType), AttributeOwner.Entity)
}

function partition(catalogName: string, symbols: [SchemaSymbol, string[]?][]): CatalogSymbolPartition {
    const result: CatalogSymbolPartition = new CatalogSymbolPartition(catalogName, `${catalogName}-fingerprint`)
    for (const [symbol, variants] of symbols) {
        result.add(symbol, variants ?? [])
    }
    return result
}

function names(results: SymbolSearchResults): string[] {
    return results.results.map(it => `${it.symbol.type}:${it.symbol.displayPath.join('/')}/${it.symbol.name}`)
}

describe('index structure', () => {
    test('Should group symbols sharing a name under one key', () => {
        const brandCode: SchemaSymbol = attribute('evita', 'brand', 'code')
        const productCode: SchemaSymbol = attribute('evita', 'product', 'code')
        const evita: CatalogSymbolPartition = partition('evita', [[brandCode], [productCode]])

        expect(evita.keyCount).toBe(1)
        expect(evita.symbolCount).toBe(2)
        expect(evita.getKey('code')?.symbols).toEqual([brandCode, productCode])
    })

    test('Should index name variants as keys pointing to the same symbol and return it once', () => {
        const symbol: SchemaSymbol = attribute('evita', 'product', 'ean13Code')
        const evita: CatalogSymbolPartition = partition('evita', [
            [symbol, ['ean13Code', 'Ean13Code', 'ean_13_code', 'EAN_13_CODE', 'ean-13-code']]
        ])
        // all variants collapse into one normalized key
        expect(evita.keyCount).toBe(1)
        expect(evita.symbolCount).toBe(1)

        const index: SymbolIndex = new SymbolIndex()
        index.replacePartition(evita)
        const results: SymbolSearchResults = index.search('EAN_13')
        expect(results.totalCount).toBe(1)
        expect(results.results[0]?.symbol).toBe(symbol)
    })

    test('Should deduplicate a symbol hit through differently normalized variant keys', () => {
        const symbol: SchemaSymbol = attribute('evita', 'product', 'urlName')
        const evita: CatalogSymbolPartition = partition('evita', [[symbol, ['url-name-x']]])
        expect(evita.keyCount).toBe(2)

        const index: SymbolIndex = new SymbolIndex()
        index.replacePartition(evita)
        const results: SymbolSearchResults = index.search('url')
        expect(results.totalCount).toBe(1)
    })

    test('Should keep the finest word split of a shared key regardless of insertion order', () => {
        for (const order of [['productcode', 'productCode'], ['productCode', 'productcode']]) {
            const flat: SchemaSymbol = attribute('evita', 'a', order[0] ?? '')
            const camel: SchemaSymbol = attribute('evita', 'b', order[1] ?? '')
            const evita: CatalogSymbolPartition = partition('evita', [[flat], [camel]])
            expect(evita.getKey('productcode')?.words).toEqual(['product', 'code'])
            expect(evita.getKey('productcode')?.symbols).toEqual([flat, camel])

            const index: SymbolIndex = new SymbolIndex()
            index.replacePartition(evita)
            expect(index.search('pc').totalCount).toBe(2)
        }
    })

    test('Should replace and drop partitions per catalog', () => {
        const index: SymbolIndex = new SymbolIndex()
        index.replacePartition(partition('a', [[attribute('a', 'product', 'code')]]))
        index.replacePartition(partition('b', [[attribute('b', 'product', 'code')]]))
        expect(index.search('code').totalCount).toBe(2)
        expect(index.symbolCount).toBe(2)

        index.replacePartition(partition('a', [[attribute('a', 'product', 'name')]]))
        expect(index.search('code').totalCount).toBe(1)
        expect(index.search('name').totalCount).toBe(1)

        index.dropPartition('b')
        expect(index.search('code').totalCount).toBe(0)
        expect(index.catalogNames).toEqual(['a'])
    })

    test('Should return nothing for an empty query', () => {
        const index: SymbolIndex = new SymbolIndex()
        index.replacePartition(partition('evita', [[attribute('evita', 'product', 'code')]]))
        expect(index.search('').totalCount).toBe(0)
        expect(index.search('  _ ').totalCount).toBe(0)
    })
})

describe('ordering', () => {
    test('Should order by type first, then by match quality, length, alphabet and path', () => {
        const index: SymbolIndex = new SymbolIndex()
        index.replacePartition(partition('barcodes', [
            [new SchemaSymbol(SymbolType.Catalog, 'barcodes', new SymbolPath('barcodes'))],
            [attribute('barcodes', 'product', 'barcode')],
            [attribute('barcodes', 'product', 'productCode')],
            [attribute('barcodes', 'product', 'codeShort')],
            [attribute('barcodes', 'product', 'code')],
            [attribute('barcodes', 'brand', 'code')],
            [new SchemaSymbol(SymbolType.Reference, 'codeRef', new SymbolPath('barcodes', 'product'))],
            [new SchemaSymbol(SymbolType.EntityCollection, 'code', new SymbolPath('barcodes'))]
        ]))

        expect(names(index.search('code'))).toEqual([
            'catalog:/barcodes',
            'entityCollection:barcodes/code',
            'attribute:barcodes/brand/code',
            'attribute:barcodes/product/code',
            'attribute:barcodes/product/codeShort',
            'attribute:barcodes/product/productCode',
            'attribute:barcodes/product/barcode',
            'reference:barcodes/product/codeRef'
        ])
    })

    test('Should order compounds right after attributes and before associated data', () => {
        const index: SymbolIndex = new SymbolIndex()
        const path: SymbolPath = new SymbolPath('evita', 'product')
        index.replacePartition(partition('evita', [
            [new SchemaSymbol(SymbolType.Reference, 'order', path)],
            [new SchemaSymbol(SymbolType.AssociatedData, 'order', path)],
            [new SchemaSymbol(SymbolType.SortableAttributeCompound, 'order', path, AttributeOwner.Entity)],
            [new SchemaSymbol(SymbolType.Attribute, 'order', path, AttributeOwner.Entity)]
        ]))
        expect(index.search('order').results.map(it => it.symbol.type)).toEqual([
            SymbolType.Attribute,
            SymbolType.SortableAttributeCompound,
            SymbolType.AssociatedData,
            SymbolType.Reference
        ])
    })

    test('Should use the best tier of a symbol hit through several keys', () => {
        const symbol: SchemaSymbol = attribute('evita', 'product', 'parameterValue')
        const index: SymbolIndex = new SymbolIndex()
        index.replacePartition(partition('evita', [[symbol, ['pvAlias']]]))
        // "pv" is a prefix of the alias key and only a chain of the display name
        expect(index.search('pv').results[0]?.tier).toBe(MatchTier.Prefix)
    })

    test('Should render at most the result limit and report the total count', () => {
        const symbols: [SchemaSymbol][] = []
        for (let i = 0; i < 250; i++) {
            symbols.push([attribute('evita', `entity${i}`, 'code')])
        }
        const index: SymbolIndex = new SymbolIndex()
        index.replacePartition(partition('evita', symbols))

        const results: SymbolSearchResults = index.search('code')
        expect(results.totalCount).toBe(250)
        expect(results.results.length).toBe(200)
    })
})

describe('highlight', () => {
    test('Should provide display ranges of the display name', () => {
        const index: SymbolIndex = new SymbolIndex()
        index.replacePartition(partition('evita', [[attribute('evita', 'product', 'parameter_value')]]))
        expect(index.search('pv').results[0]?.displayRanges).toEqual([[0, 1], [10, 11]])
    })

    test('Should not highlight when the best key is a variant normalizing differently from the display name', () => {
        const index: SymbolIndex = new SymbolIndex()
        index.replacePartition(partition('evita', [[attribute('evita', 'product', 'parameterValue'), ['pvAlias']]]))
        expect(index.search('pv').results[0]?.displayRanges).toEqual([])
    })
})
