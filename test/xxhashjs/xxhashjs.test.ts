import { test, expect } from 'vitest'
import XXH, { HashObject } from 'xxhashjs'

/**
 * Tests for xxhashjs usage
 */

test('Should correctly hash array of values', () => {
    const hasher: HashObject = XXH.h64()

    expect(hasher.update('a').update('b').update('c').digest())
        .toEqual(hasher.update('a').update('b').update('c').digest())
    expect(hasher.update('c').update('b').update('a').digest())
        .not
        .toEqual(hasher.update('a').update('b').update('c').digest())
    expect(hasher.update('a').update('b').update('c').digest())
        .not
        .toEqual(hasher.update('b').update('c').digest())
})
