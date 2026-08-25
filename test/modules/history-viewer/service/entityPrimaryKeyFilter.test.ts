import { expect, test } from 'vitest'
import {
    isEntityPrimaryKeyFilterValid,
    parseEntityPrimaryKeyFilter
} from '@/modules/history-viewer/service/entityPrimaryKeyFilter'

/**
 * The filter input had no validation at all, and its raw string value was assigned straight into the criteria typed as
 * a number, so a typed primary key reached the gRPC request as a string.
 */

test('Should parse a whole number into a number', () => {
    expect(parseEntityPrimaryKeyFilter('42')).toBe(42)
    expect(parseEntityPrimaryKeyFilter(' 42 ')).toBe(42)
    expect(parseEntityPrimaryKeyFilter('0')).toBe(0)
})

test('Should not parse a malformed primary key', () => {
    expect(parseEntityPrimaryKeyFilter('4.2')).toBeUndefined()
    expect(parseEntityPrimaryKeyFilter('-42')).toBeUndefined()
    expect(parseEntityPrimaryKeyFilter('abc')).toBeUndefined()
    expect(parseEntityPrimaryKeyFilter('42abc')).toBeUndefined()
    expect(parseEntityPrimaryKeyFilter('c8b5f1a2-0000-0000-0000-000000000000')).toBeUndefined()
})

test('Should treat an empty input as no filtering', () => {
    expect(parseEntityPrimaryKeyFilter('')).toBeUndefined()
    expect(parseEntityPrimaryKeyFilter('   ')).toBeUndefined()
    expect(parseEntityPrimaryKeyFilter(undefined)).toBeUndefined()
})

test('Should accept an empty and a whole-number input', () => {
    expect(isEntityPrimaryKeyFilterValid('')).toBe(true)
    expect(isEntityPrimaryKeyFilterValid('   ')).toBe(true)
    expect(isEntityPrimaryKeyFilterValid(undefined)).toBe(true)
    expect(isEntityPrimaryKeyFilterValid('42')).toBe(true)
})

test('Should reject a non-numeric input', () => {
    expect(isEntityPrimaryKeyFilterValid('4.2')).toBe(false)
    expect(isEntityPrimaryKeyFilterValid('-42')).toBe(false)
    expect(isEntityPrimaryKeyFilterValid('abc')).toBe(false)
})
