import { describe, expect, test } from 'vitest'
import {
    matchesEndpointSearchTerms,
    splitEndpointSearchTerms
} from '@/modules/rest-console/console/service/endpointPickerSearch'

describe('Endpoint picker search', () => {
    test('Should split the search into lower-case terms', () => {
        expect(splitEndpointSearchTerms('  Product   Primary ')).toEqual(['product', 'primary'])
    })

    test('Should treat a cleared (null) or empty search as no terms', () => {
        expect(splitEndpointSearchTerms(null)).toEqual([])
        expect(splitEndpointSearchTerms(undefined)).toEqual([])
        expect(splitEndpointSearchTerms('   ')).toEqual([])
    })

    test('Should require every term somewhere in the searchable texts', () => {
        const texts: (string | undefined)[] = ['Product', 'Get entity by primary key', 'getProductById', undefined]
        expect(matchesEndpointSearchTerms(texts, ['product', 'primary'])).toBe(true)
        expect(matchesEndpointSearchTerms(texts, ['product', 'query'])).toBe(false)
        expect(matchesEndpointSearchTerms(texts, [])).toBe(true)
    })
})
