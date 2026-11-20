import { describe, expect, test } from 'vitest'
import { parseRestResult, parseRestResultJson } from '@/modules/rest-console/console/service/parseRestResultJson'

describe('REST result JSON parsing', () => {
    test('Should keep integers above 2^53 exact as bigint', () => {
        const parsed = parseRestResultJson('{"hash": 6944790088528211031, "negative": -5873445194656104762}') as Record<string, unknown>
        expect(parsed['hash']).toBe(6944790088528211031n)
        expect(parsed['negative']).toBe(-5873445194656104762n)
    })

    test('Should keep every other number a plain number', () => {
        const parsed = parseRestResultJson('{"count": 269, "ratio": 0.5, "big": 1e400}') as Record<string, unknown>
        expect(parsed['count']).toBe(269)
        expect(parsed['ratio']).toBe(0.5)
        expect(parsed['big']).toBe(Infinity)
    })

    test('Should refuse invalid JSON', () => {
        expect(() => parseRestResultJson('{')).toThrow()
    })
})

describe('REST result parsed once for both views', () => {
    test('Should pretty-print every number as its original text and convert them for the visualisers', () => {
        const parsed = parseRestResult('{"min":1.50,"hash":-1670645581396870523,"count":3}')
        expect(parsed.prettyText).toBe('{\n  "min": 1.50,\n  "hash": -1670645581396870523,\n  "count": 3\n}')
        expect(parsed.value).toEqual({ min: 1.5, hash: -1670645581396870523n, count: 3 })
    })
})
