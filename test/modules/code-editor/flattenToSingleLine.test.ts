import { test, expect } from 'vitest'
import { flattenToSingleLine } from '../../../src/modules/code-editor/model/flattenToSingleLine'

test('Should flatten pretty printed query into single line', () => {
    expect(flattenToSingleLine(
        'and(\n' +
        '    attributeContains("code", "shirt"),\n' +
        '    entityPrimaryKeyInSet(1, 2, 3)\n' +
        ')'
    )).toEqual('and( attributeContains("code", "shirt"), entityPrimaryKeyInSet(1, 2, 3) )')
})

test('Should drop blank lines and indentation', () => {
    expect(flattenToSingleLine('a\n\n\t \nb')).toEqual('a b')
    expect(flattenToSingleLine('\n\na\n\n')).toEqual('a')
})

test('Should normalize CRLF and CR line endings', () => {
    expect(flattenToSingleLine('a\r\nb')).toEqual('a b')
    expect(flattenToSingleLine('a\rb')).toEqual('a b')
    expect(flattenToSingleLine('a\r\nb\rc\nd')).toEqual('a b c d')
})

test('Should leave single line text untouched', () => {
    expect(flattenToSingleLine('attributeContains("code", "shirt")')).toEqual('attributeContains("code", "shirt")')
    expect(flattenToSingleLine(' padded ')).toEqual(' padded ')
})

test('Should trim lines of multiline text despite the single line identity', () => {
    expect(flattenToSingleLine(' a \n b ')).toEqual('a b')
})

test('Should return empty string for whitespace only input', () => {
    expect(flattenToSingleLine('\n')).toEqual('')
    expect(flattenToSingleLine('\n    ')).toEqual('')
})
