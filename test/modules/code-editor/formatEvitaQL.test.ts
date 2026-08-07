import { test, expect } from 'vitest'
import { minifyEvitaQL, prettifyEvitaQL } from '../../../src/modules/code-editor/service/formatEvitaQL'
import { DocumentFormattingError } from '../../../src/modules/code-editor/exception/DocumentFormattingError'

const nestedQuery: string =
    'query(collection("Product"),filterBy(entityLocaleEquals("en"),' +
    'attributeEquals("code","shirt")),require(entityFetch(attributeContent("code","name"))))'

test('Should break constraints containing other constraints and keep leaf constraints on one line', () => {
    expect(prettifyEvitaQL(nestedQuery)).toEqual(
        'query(\n' +
        '  collection("Product"),\n' +
        '  filterBy(\n' +
        '    entityLocaleEquals("en"),\n' +
        '    attributeEquals("code", "shirt")\n' +
        '  ),\n' +
        '  require(\n' +
        '    entityFetch(\n' +
        '      attributeContent("code", "name")\n' +
        '    )\n' +
        '  )\n' +
        ')'
    )
})

test('Should collapse a query into a single line', () => {
    expect(minifyEvitaQL(prettifyEvitaQL(nestedQuery))).toEqual(nestedQuery)
})

test('Should never split a comma inside a string literal', () => {
    const query: string = 'query(collection("Product"),require(entityFetch(attributeContent("code, weird"))))'
    expect(prettifyEvitaQL(query)).toContain('attributeContent("code, weird")')
    expect(minifyEvitaQL(query)).toEqual(query)
})

test('Should keep an empty argument list empty', () => {
    expect(minifyEvitaQL('query(collection("A"), require(entityFetch()))'))
        .toEqual('query(collection("A"),require(entityFetch()))')
})

test('Should keep a range inline and normalize its whitespace', () => {
    expect(prettifyEvitaQL('query(filterBy(attributeInRange("a", [1,\n  5])))')).toEqual(
        'query(\n' +
        '  filterBy(\n' +
        '    attributeInRange("a", [1, 5])\n' +
        '  )\n' +
        ')'
    )
})

test('Should keep an open range open', () => {
    expect(minifyEvitaQL('query(filterBy(attributeInRange("a", [1, ])))'))
        .toEqual('query(filterBy(attributeInRange("a",[1, ])))')
})

test('Should keep comments on their own lines when prettifying', () => {
    expect(prettifyEvitaQL(
        '// leading\n' +
        'query(collection("A"), // trailing on collection\n' +
        ' filterBy(\n' +
        '  // inner\n' +
        '  entityPrimaryKeyInSet(1)))'
    )).toEqual(
        '// leading\n' +
        'query(\n' +
        '  collection("A"),\n' +
        '  // trailing on collection\n' +
        '  filterBy(\n' +
        '    // inner\n' +
        '    entityPrimaryKeyInSet(1)\n' +
        '  )\n' +
        ')'
    )
})

test('Should drop comments when minifying so they cannot comment out the query', () => {
    expect(minifyEvitaQL(
        '// leading\n' +
        'query(collection("A"), // trailing on collection\n' +
        ' filterBy(entityPrimaryKeyInSet(1)))'
    )).toEqual('query(collection("A"),filterBy(entityPrimaryKeyInSet(1)))')
})

test('Should lift a comment placed between a constraint name and its arguments', () => {
    const query: string = 'query // why\n(collection("A"))'
    expect(prettifyEvitaQL(query)).toEqual(
        '// why\n' +
        'query(\n' +
        '  collection("A")\n' +
        ')'
    )
    expect(minifyEvitaQL(query)).toEqual('query(collection("A"))')
})

test('Should be idempotent', () => {
    const prettified: string = prettifyEvitaQL(nestedQuery)
    expect(prettifyEvitaQL(prettified)).toEqual(prettified)
    expect(prettifyEvitaQL(minifyEvitaQL(nestedQuery))).toEqual(prettified)
    expect(minifyEvitaQL(minifyEvitaQL(nestedQuery))).toEqual(minifyEvitaQL(nestedQuery))
})

test('Should be idempotent on a commented query once the comments are prettified', () => {
    const prettified: string = prettifyEvitaQL('query(collection("A"), // c\n filterBy(entityPrimaryKeyInSet(1)))')
    expect(prettifyEvitaQL(prettified)).toEqual(prettified)
})

test('Should refuse to format an unparsable query', () => {
    expect(() => prettifyEvitaQL('query(collection("Product"), filterBy(')).toThrow(DocumentFormattingError)
    expect(() => minifyEvitaQL('query(collection("Product"), filterBy(')).toThrow(DocumentFormattingError)
})

test('Should refuse to format a query using constraints unknown to the evitaQL grammar', () => {
    // the bundled grammar does not know the head() root constraint yet
    expect(() => prettifyEvitaQL('query(head(collection("A")), filterBy(entityPrimaryKeyInSet(1)))'))
        .toThrow(DocumentFormattingError)
})

test('Should refuse to format a document with no query in it', () => {
    for (const document of ['', '   ', '// Write your EvitaQL query for catalog test here.\n']) {
        expect(() => prettifyEvitaQL(document)).toThrow(DocumentFormattingError)
        expect(() => minifyEvitaQL(document)).toThrow(DocumentFormattingError)
    }
})
