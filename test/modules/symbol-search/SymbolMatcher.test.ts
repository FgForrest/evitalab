import { describe, expect, test } from 'vitest'
import {
    createSymbolKey,
    initialsMaskOf,
    matchSymbolKey,
    matchWordPrefixChain,
    normalizeSymbolName,
    normalizeSymbolQuery,
    splitSymbolNameIntoWords,
    type SymbolMatch,
    toDisplayRanges
} from '@/modules/symbol-search/service/SymbolMatcher'
import type { SymbolKey } from '@/modules/symbol-search/model/SymbolKey'
import { MatchTier } from '@/modules/symbol-search/model/MatchTier'

function key(name: string): SymbolKey {
    return createSymbolKey(name)
}

function match(name: string, query: string): SymbolMatch | undefined {
    return matchSymbolKey(key(name), normalizeSymbolQuery(query))
}

describe('normalization', () => {
    test('Should lower-case and strip separators from names', () => {
        expect(normalizeSymbolName('productPrice')).toBe('productprice')
        expect(normalizeSymbolName('product_price')).toBe('productprice')
        expect(normalizeSymbolName('PRODUCT-PRICE')).toBe('productprice')
        expect(normalizeSymbolName('Product Price')).toBe('productprice')
    })

    test('Should normalize a query the same way as a name', () => {
        expect(normalizeSymbolQuery('  Par Val ')).toBe('parval')
        expect(normalizeSymbolQuery('URL_NAME')).toBe('urlname')
    })

    test('Should split names into words on humps, digits and separators', () => {
        expect(splitSymbolNameIntoWords('parameterGroupValue')).toEqual(['parameter', 'group', 'value'])
        expect(splitSymbolNameIntoWords('ParameterValue')).toEqual(['parameter', 'value'])
        expect(splitSymbolNameIntoWords('parameter_value')).toEqual(['parameter', 'value'])
        expect(splitSymbolNameIntoWords('PARAMETER_VALUE')).toEqual(['parameter', 'value'])
        expect(splitSymbolNameIntoWords('parameter-value')).toEqual(['parameter', 'value'])
        expect(splitSymbolNameIntoWords('ean13Code')).toEqual(['ean', '13', 'code'])
        expect(splitSymbolNameIntoWords('productURLName')).toEqual(['product', 'url', 'name'])
        expect(splitSymbolNameIntoWords('code')).toEqual(['code'])
    })

    test('Should compute word starts consistent with the normalized key', () => {
        const symbolKey: SymbolKey = key('parameterGroupValue')
        expect(symbolKey.key).toBe('parametergroupvalue')
        expect(symbolKey.wordStarts).toEqual([0, 9, 14])
        expect(symbolKey.words.join('')).toBe(symbolKey.key)
    })

    test('Should compute initials mask of letters only', () => {
        expect(initialsMaskOf(['parameter', 'value'])).toBe((1 << 15) | (1 << 21))
        expect(initialsMaskOf(['ean', '13', 'code'])).toBe((1 << 4) | (1 << 2))
    })
})

describe('match tiers', () => {
    test('Should classify exact match as tier 0', () => {
        expect(match('code', 'code')?.tier).toBe(MatchTier.Exact)
        expect(match('code', 'CODE')?.tier).toBe(MatchTier.Exact)
    })

    test('Should classify prefix match as tier 1', () => {
        const result: SymbolMatch | undefined = match('codeShort', 'code')
        expect(result?.tier).toBe(MatchTier.Prefix)
        expect(result?.ranges).toEqual([[0, 4]])
    })

    test('Should classify word start match as tier 2', () => {
        const result: SymbolMatch | undefined = match('productCode', 'code')
        expect(result?.tier).toBe(MatchTier.WordStart)
        expect(result?.ranges).toEqual([[7, 11]])
    })

    test('Should find a word start match at any occurrence, not only the first one', () => {
        // first occurrence of "code" is inside "barcode", the second one starts a word
        const result: SymbolMatch | undefined = match('barcodeCode', 'code')
        expect(result?.tier).toBe(MatchTier.WordStart)
        expect(result?.ranges).toEqual([[7, 11]])
    })

    test('Should classify word-prefix chain as tier 3', () => {
        const result: SymbolMatch | undefined = match('parameterCategory', 'pc')
        expect(result?.tier).toBe(MatchTier.WordPrefixChain)
        expect(result?.ranges).toEqual([[0, 1], [9, 10]])
    })

    test('Should match word prefixes longer than initials', () => {
        const result: SymbolMatch | undefined = match('parameterValue', 'parval')
        expect(result?.tier).toBe(MatchTier.WordPrefixChain)
        expect(result?.ranges).toEqual([[0, 3], [9, 12]])
        expect(match('parameterValue', 'pav')?.tier).toBe(MatchTier.WordPrefixChain)
        expect(match('parameterValue', 'pva')?.tier).toBe(MatchTier.WordPrefixChain)
    })

    test('Should classify chain needing a skipped word as tier 4', () => {
        const result: SymbolMatch | undefined = match('parameterGroupValue', 'pv')
        expect(result?.tier).toBe(MatchTier.WordPrefixChainWithSkips)
        expect(result?.ranges).toEqual([[0, 1], [14, 15]])
    })

    test('Should prefer a skip-free chain over one with skips', () => {
        expect(match('parameterGroupValue', 'pg')?.tier).toBe(MatchTier.WordPrefixChain)
        expect(match('parameterGroupValue', 'gv')?.tier).toBe(MatchTier.WordPrefixChain)
    })

    test('Should classify substring inside a word as tier 5', () => {
        const result: SymbolMatch | undefined = match('barcode', 'code')
        expect(result?.tier).toBe(MatchTier.Substring)
        expect(result?.ranges).toEqual([[3, 7]])
    })

    test('Should prefer a chain over a substring match of the same key', () => {
        // "pc" sits inside the word "apc", but it is also a chain over "price" + "code"
        expect(match('apcPriceCode', 'pc')?.tier).toBe(MatchTier.WordPrefixChain)
    })

    test('Should match regardless of separators and case in the query', () => {
        expect(match('parameterValue', 'PARAMETER_VALUE')?.tier).toBe(MatchTier.Exact)
        expect(match('parameterValue', 'par val')?.tier).toBe(MatchTier.WordPrefixChain)
        expect(match('url_name', 'urlName')?.tier).toBe(MatchTier.Exact)
    })

    test('Should not produce false positives', () => {
        expect(match('parameterValue', 'pvx')).toBeUndefined()
        expect(match('parameterValue', 'vp')).toBeUndefined()
        expect(match('code', 'codes')).toBeUndefined()
        expect(match('brand', 'x')).toBeUndefined()
        expect(match('name', '')).toBeUndefined()
    })

    test('Should handle queries starting with a digit without the initials prefilter', () => {
        expect(match('ean13Code', '1c')?.tier).toBe(MatchTier.WordPrefixChain)
        expect(match('ean13Code', '13')?.tier).toBe(MatchTier.WordStart)
    })
})

describe('word-prefix chain', () => {
    test('Should backtrack where a greedy cut fails', () => {
        // greedy takes "so" from "sort", leaving "rder" which is no prefix of "order"
        const result: SymbolMatch | undefined = matchWordPrefixChain(key('sortOrder'), 'sorder')
        expect(result?.tier).toBe(MatchTier.WordPrefixChain)
        expect(result?.ranges).toEqual([[0, 1], [4, 9]])
    })

    test('Should start the chain at any word', () => {
        const result: SymbolMatch | undefined = matchWordPrefixChain(key('productParameterValue'), 'pv')
        // strict chain "parameter" + "value" exists, so no skip is needed
        expect(result?.tier).toBe(MatchTier.WordPrefixChain)
        expect(result?.ranges).toEqual([[7, 8], [16, 17]])
    })

    test('Should skip words in the middle when no skip-free cut exists', () => {
        const result: SymbolMatch | undefined = matchWordPrefixChain(key('aBxC'), 'ac')
        expect(result?.tier).toBe(MatchTier.WordPrefixChainWithSkips)
        expect(result?.ranges).toEqual([[0, 1], [3, 4]])
    })

    test('Should fail when the query is longer than what the words can cover', () => {
        expect(matchWordPrefixChain(key('aB'), 'abc')).toBeUndefined()
    })
})

describe('display ranges', () => {
    test('Should map normalized ranges onto the display name skipping separators', () => {
        expect(toDisplayRanges('parameter_value', [[0, 3], [9, 12]])).toEqual([[0, 3], [10, 13]])
    })

    test('Should merge adjacent display ranges', () => {
        expect(toDisplayRanges('codeShort', [[0, 2], [2, 4]])).toEqual([[0, 4]])
    })

    test('Should split a range crossing a separator', () => {
        expect(toDisplayRanges('url_name', [[0, 7]])).toEqual([[0, 3], [4, 8]])
    })
})
