import { test, expect } from 'vitest'
import { deepMerge } from '../../src/utils/object'

/**
 * Tests for object utils
 */

test('Should deep merge two objects', () => {
    expect(deepMerge(
        { a: 'a', b: 'b' },
        { c: 'c' }
    ))
        .toStrictEqual({ a: 'a', b: 'b', c: 'c' })
    expect(deepMerge(
        { a: 'a', b: { c: 'c' } },
        { b: { d: { e: 'e' } } }
    ))
        .toStrictEqual({ a: 'a', b: { c: 'c', d: { e: 'e' } } })
    expect(deepMerge(
        { a: 'a', b: null },
        { b: 'b' }
    ))
        .toStrictEqual({ a: 'a', b: 'b' })
})

test('Should not deep merge two objects', () => {
    expect(() => deepMerge(
        { a: 'a' },
        { a: 'b' }
    ))
        .toThrowError()
    expect(() => deepMerge(
        { a: { b: 'b' } },
        { a: 'b' }
    ))
        .toThrowError()
})
