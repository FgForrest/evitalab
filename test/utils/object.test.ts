import { test, expect } from 'vitest'
import { deepMerge, isPlainObjectOrArray } from '../../src/utils/object'
import { List as ImmutableList } from 'immutable'

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

test('Should recognize plain objects and arrays', () => {
    expect(isPlainObjectOrArray({ a: 1 })).toBe(true)
    expect(isPlainObjectOrArray(Object.create(null))).toBe(true)
    expect(isPlainObjectOrArray([1])).toBe(true)
})

test('Should not recognize class instances, collections and primitives as plain', () => {
    expect(isPlainObjectOrArray(new Date())).toBe(false)
    expect(isPlainObjectOrArray(new Map())).toBe(false)
    expect(isPlainObjectOrArray(ImmutableList([1]))).toBe(false)
    expect(isPlainObjectOrArray('text')).toBe(false)
    expect(isPlainObjectOrArray(null)).toBe(false)
    expect(isPlainObjectOrArray(undefined)).toBe(false)
})
