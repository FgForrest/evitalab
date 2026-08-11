import { describe, expect, test } from 'vitest'
import { xxh64Hex } from '@/utils/hash'

/**
 * The hash namespaces persisted storage (the local storage namespace of {@link LabStorage} and the database name
 * of {@link LabServerDataCache}), so both properties tested here are load-bearing: the shared hasher instance
 * must not carry state between calls, and the produced value must never change across versions.
 */

describe('xxh64Hex', () => {
    test('returns the same hash for the same value, however often it is called', () => {
        // the whole reason a single hasher instance can be shared: `digest()` re-initializes it
        expect(xxh64Hex('http://localhost:5555')).toBe(xxh64Hex('http://localhost:5555'))
        // and an interleaved different value cannot leak into the next call either
        xxh64Hex('something else entirely')
        expect(xxh64Hex('http://localhost:5555')).toBe(xxh64Hex('http://localhost:5555'))
    })

    test('distinguishes different values', () => {
        expect(xxh64Hex('abc')).not.toBe(xxh64Hex('cba'))
    })

    test('produces the values evitaLab has always stored under', () => {
        // known vectors of the default seed 0; changing the seed would abandon every user's stored data
        expect(xxh64Hex('http://localhost:5555')).toBe('a950b38d839d45d6')
        expect(xxh64Hex('evitaLab')).toBe('fa5ec76397d5915')
    })
})
