import { test, expect } from 'vitest'
import { minifyGraphQL, prettifyGraphQL } from '../../../src/modules/code-editor/service/formatGraphQL'
import { DocumentFormattingError } from '../../../src/modules/code-editor/exception/DocumentFormattingError'

const query: string = 'query{queryProduct(filterBy:{attributeCodeEquals:"shirt"}){recordPage{data{primaryKey}}}}'

test('Should indent a GraphQL query', () => {
    expect(prettifyGraphQL(query)).toEqual(
        '{\n' +
        '  queryProduct(filterBy: {attributeCodeEquals: "shirt"}) {\n' +
        '    recordPage {\n' +
        '      data {\n' +
        '        primaryKey\n' +
        '      }\n' +
        '    }\n' +
        '  }\n' +
        '}'
    )
})

test('Should collapse a GraphQL query into a single line', () => {
    expect(minifyGraphQL(prettifyGraphQL(query))).toEqual(
        '{queryProduct(filterBy:{attributeCodeEquals:"shirt"}){recordPage{data{primaryKey}}}}'
    )
})

test('Should be idempotent', () => {
    const prettified: string = prettifyGraphQL(query)
    expect(prettifyGraphQL(prettified)).toEqual(prettified)
    expect(minifyGraphQL(minifyGraphQL(query))).toEqual(minifyGraphQL(query))
})

test('Should drop comments and the anonymous query keyword, which the GraphQL printer cannot preserve', () => {
    expect(prettifyGraphQL('# a comment\nquery { __typename }')).toEqual('{\n  __typename\n}')
    expect(minifyGraphQL('# a comment\nquery { __typename }')).toEqual('query{__typename}')
})

test('Should keep a named operation named', () => {
    expect(prettifyGraphQL('query Products { __typename }')).toEqual('query Products {\n  __typename\n}')
})

test('Should refuse to prettify an unparsable document', () => {
    expect(() => prettifyGraphQL('query { foo(')).toThrow(DocumentFormattingError)
})

test('Should refuse to format a document with no operation in it', () => {
    for (const document of ['', '   ', '# Write your GraphQL query for catalog test here.\n']) {
        expect(() => prettifyGraphQL(document)).toThrow(DocumentFormattingError)
        expect(() => minifyGraphQL(document)).toThrow(DocumentFormattingError)
    }
})
