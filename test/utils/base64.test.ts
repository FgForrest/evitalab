import { test, expect, describe } from 'vitest'
import { decodeBase64ToUtf8, tryDecodeBase64ToUtf8 } from '../../src/utils/base64'
import { UnexpectedError } from '../../src/modules/base/exception/UnexpectedError'

/**
 * Encodes a string into standard padded base64 the same way an external producer would.
 */
function encodeUtf8ToBase64(value: string): string {
    const bytes: Uint8Array = new TextEncoder().encode(value)
    let binary: string = ''
    bytes.forEach((byte: number) => binary += String.fromCharCode(byte))
    return btoa(binary)
}

describe('decodeBase64ToUtf8', () => {
    test('decodes standard padded base64', () => {
        expect(decodeBase64ToUtf8(encodeUtf8ToBase64('{"tabType":"entityViewer"}')))
            .toEqual('{"tabType":"entityViewer"}')
    })

    test('decodes base64url without padding', () => {
        const value: string = '{"a":"??>>"}'
        const base64url: string = encodeUtf8ToBase64(value)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '')

        expect(base64url).not.toContain('=')
        expect(decodeBase64ToUtf8(base64url)).toEqual(value)
    })

    test('decodes base64url with padding', () => {
        const value: string = 'padded!'
        const base64url: string = encodeUtf8ToBase64(value).replace(/\+/g, '-').replace(/\//g, '_')

        expect(base64url).toContain('=')
        expect(decodeBase64ToUtf8(base64url)).toEqual(value)
    })

    test('decodes standard base64 containing plus and slash characters', () => {
        const value: string = '~~~???>>>'
        const encoded: string = encodeUtf8ToBase64(value)

        expect(encoded).toMatch(/[+/]/)
        expect(decodeBase64ToUtf8(encoded)).toEqual(value)
    })

    test('treats a space as a plus sign, as URLSearchParams produces', () => {
        const value: string = '~~~???>>>'
        const encoded: string = encodeUtf8ToBase64(value)
        const afterQueryParamRoundTrip: string = encoded.replace(/\+/g, ' ')

        expect(afterQueryParamRoundTrip).toContain(' ')
        expect(decodeBase64ToUtf8(afterQueryParamRoundTrip)).toEqual(value)
    })

    test('decodes non-ASCII payloads as UTF-8', () => {
        // a bare `atob` would silently produce mojibake here
        expect(decodeBase64ToUtf8(encodeUtf8ToBase64('Můj server'))).toEqual('Můj server')
        expect(decodeBase64ToUtf8(encodeUtf8ToBase64('Příklad – žluťoučký kůň')))
            .toEqual('Příklad – žluťoučký kůň')
    })

    test('decodes an empty value into an empty string', () => {
        expect(decodeBase64ToUtf8('')).toEqual('')
    })

    test('throws on characters outside both base64 alphabets', () => {
        expect(() => decodeBase64ToUtf8('not$base64')).toThrow(UnexpectedError)
    })

    test('throws on a length that cannot be re-padded', () => {
        expect(() => decodeBase64ToUtf8('abcde')).toThrow(UnexpectedError)
    })

    test('throws on valid base64 carrying invalid UTF-8 bytes', () => {
        // 0xFF is never a valid UTF-8 lead byte
        expect(() => decodeBase64ToUtf8(btoa('ÿþ'))).toThrow(UnexpectedError)
    })
})

describe('tryDecodeBase64ToUtf8', () => {
    test('returns the decoded value for valid input', () => {
        expect(tryDecodeBase64ToUtf8(encodeUtf8ToBase64('Příklad'))).toEqual('Příklad')
    })

    test('returns undefined instead of throwing on invalid input', () => {
        expect(tryDecodeBase64ToUtf8('not$base64')).toBeUndefined()
        expect(tryDecodeBase64ToUtf8('abcde')).toBeUndefined()
        expect(tryDecodeBase64ToUtf8(btoa('ÿþ'))).toBeUndefined()
    })
})
