import { test, expect } from 'vitest'
import { EditorSelection, EditorState, Transaction } from '@codemirror/state'
import { singleLineDocument } from '../../../src/modules/code-editor/extension/singleLineDocument'

const prettyPrintedQuery: string =
    'and(\n' +
    '    attributeContains("code", "shirt"),\n' +
    '    entityPrimaryKeyInSet(1, 2, 3)\n' +
    ')'
const flattenedQuery: string = 'and( attributeContains("code", "shirt"), entityPrimaryKeyInSet(1, 2, 3) )'

function state(doc: string = '', selection?: { anchor: number, head?: number }): EditorState {
    return EditorState.create({
        doc,
        selection,
        extensions: [singleLineDocument()]
    })
}

test('Should insert flattened text when pasting multiline query', () => {
    const transaction: Transaction = state().update({
        changes: { from: 0, insert: prettyPrintedQuery },
        userEvent: 'input.paste'
    })

    expect(transaction.newDoc.toString()).toEqual(flattenedQuery)
    expect(transaction.newDoc.lines).toEqual(1)
})

test('Should place cursor after pasted text', () => {
    const transaction: Transaction = state().update({
        changes: { from: 0, insert: prettyPrintedQuery },
        userEvent: 'input.paste'
    })

    expect(transaction.newSelection.main.empty).toBe(true)
    expect(transaction.newSelection.main.head).toEqual(flattenedQuery.length)
})

test('Should replace selection with flattened text and place cursor after it', () => {
    const transaction: Transaction = state('xxyy', { anchor: 1, head: 3 }).update({
        changes: { from: 1, to: 3, insert: 'a\nb' },
        userEvent: 'input.paste'
    })

    expect(transaction.newDoc.toString()).toEqual('xa by')
    expect(transaction.newSelection.main.empty).toBe(true)
    expect(transaction.newSelection.main.head).toEqual(4)
})

test('Should preserve user event of rewritten transaction to keep undo grouping', () => {
    const transaction: Transaction = state().update({
        changes: { from: 0, insert: prettyPrintedQuery },
        userEvent: 'input.paste'
    })

    expect(transaction.isUserEvent('input.paste')).toBe(true)
})

test('Should not insert anything when only a line break is inserted', () => {
    const transaction: Transaction = state('abc', { anchor: 3 }).update({
        changes: { from: 3, insert: '\n    ' },
        userEvent: 'input'
    })

    expect(transaction.newDoc.toString()).toEqual('abc')
    expect(transaction.newSelection.main.head).toEqual(3)
})

test('Should leave single line transactions untouched', () => {
    const transaction: Transaction = state('abc', { anchor: 3 }).update({
        changes: { from: 3, insert: ' def ' },
        selection: { anchor: 8 },
        userEvent: 'input.type'
    })

    expect(transaction.newDoc.toString()).toEqual('abc def ')
    expect(transaction.newSelection.main.head).toEqual(8)
})

test('Should collapse multi range selection to its main cursor', () => {
    const initialState: EditorState = EditorState.create({
        doc: 'abcdef',
        selection: EditorSelection.create([EditorSelection.cursor(1), EditorSelection.cursor(4)], 1),
        extensions: [EditorState.allowMultipleSelections.of(true), singleLineDocument()]
    })

    const transaction: Transaction = initialState.update({
        changes: { from: 4, insert: 'x\ny' },
        userEvent: 'input.paste'
    })

    expect(transaction.newDoc.toString()).toEqual('abcdx yef')
    expect(transaction.newSelection.ranges.length).toEqual(1)
    expect(transaction.newSelection.main.head).toEqual(7)
})

test('Should keep document on single line for multiple changes at once', () => {
    const transaction: Transaction = state('ab').update({
        changes: [
            { from: 0, to: 1, insert: 'x\ny' },
            { from: 1, to: 2, insert: 'z\nw' }
        ]
    })

    expect(transaction.newDoc.lines).toEqual(1)
    expect(transaction.newDoc.toString()).toEqual('x yz w')
})
