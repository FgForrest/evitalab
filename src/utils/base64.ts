import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'

/**
 * Decoder rejecting malformed UTF-8 byte sequences instead of silently replacing them with U+FFFD.
 */
const utf8Decoder: TextDecoder = new TextDecoder('utf-8', { fatal: true })

/**
 * Decodes a base64-encoded UTF-8 string. Both the standard (`+`, `/`) and the URL-safe (`-`, `_`)
 * alphabet are accepted, padding is optional, and a space is treated as a `+` because
 * `URLSearchParams` translates a raw `+` in a query string into a space.
 *
 * Unlike a bare `atob`, the result is decoded as UTF-8, so non-ASCII values survive the round trip.
 *
 * @param value the base64 or base64url encoded value
 * @throws UnexpectedError when the value is not valid base64 or does not decode into valid UTF-8
 */
export function decodeBase64ToUtf8(value: string): string {
    const decoded: string | undefined = tryDecodeBase64ToUtf8(value)
    if (decoded == undefined) {
        throw new UnexpectedError('The value is not a valid base64-encoded UTF-8 string.')
    }
    return decoded
}

/**
 * Variant of {@link decodeBase64ToUtf8} returning `undefined` instead of throwing. Intended for
 * callers that use a successful decode to detect that the input is base64 in the first place.
 *
 * @param value the base64 or base64url encoded value
 */
export function tryDecodeBase64ToUtf8(value: string): string | undefined {
    try {
        const bytes: Uint8Array = Uint8Array.from(
            atob(normalizeToStandardBase64(value)),
            (character: string) => character.charCodeAt(0)
        )
        return utf8Decoder.decode(bytes)
    } catch {
        return undefined
    }
}

/**
 * Converts the URL-safe alphabet into the standard one, restores `+` characters eaten by query
 * parameter decoding and re-adds the optional padding, so that the result can be passed to `atob`.
 */
function normalizeToStandardBase64(value: string): string {
    const standardAlphabet: string = value
        .replace(/ /g, '+')
        .replace(/-/g, '+')
        .replace(/_/g, '/')

    const paddingLength: number = (4 - (standardAlphabet.length % 4)) % 4
    return standardAlphabet + '='.repeat(paddingLength)
}
