import { test, expect } from 'vitest'
import { minifyJson, prettifyJson } from '../../../src/modules/code-editor/service/formatJson'
import { DocumentFormattingError } from '../../../src/modules/code-editor/exception/DocumentFormattingError'

test('Should indent a JSON document', () => {
    expect(prettifyJson('{"code":"shirt","pages":[1,2]}')).toEqual(
        '{\n' +
        '  "code": "shirt",\n' +
        '  "pages": [\n' +
        '    1,\n' +
        '    2\n' +
        '  ]\n' +
        '}'
    )
})

test('Should collapse a JSON document into a single line', () => {
    expect(minifyJson('{\n  "code": "shirt"\n}')).toEqual('{"code":"shirt"}')
})

test('Should be idempotent', () => {
    const document: string = '{"code":"shirt","pages":[1,2]}'
    expect(prettifyJson(prettifyJson(document))).toEqual(prettifyJson(document))
    expect(minifyJson(minifyJson(document))).toEqual(document)
})

test('Should format the empty variables document the consoles open with', () => {
    expect(prettifyJson('{\n  \n}')).toEqual('{}')
    expect(minifyJson('{\n  \n}')).toEqual('{}')
})

test('Should refuse to format an invalid JSON document', () => {
    for (const document of ['', '   ', '{"code":}', '// nope']) {
        expect(() => prettifyJson(document)).toThrow(DocumentFormattingError)
        expect(() => minifyJson(document)).toThrow(DocumentFormattingError)
    }
})
