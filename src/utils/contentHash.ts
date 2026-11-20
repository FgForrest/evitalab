import { xxh64Hex } from '@/utils/hash'

/**
 * Returns a hexadecimal hash identifying the text, computed off the main thread where possible.
 *
 * Uses the native SHA-256 of Web Crypto, which hashes megabytes in milliseconds. Web Crypto is available only in
 * secure contexts (HTTPS or localhost); an evitaLab served over plain HTTP from another host falls back to the
 * synchronous, much slower xxh64. The two produce different values, which is fine for a version identifier: a
 * mismatch only costs one extra swap.
 */
export async function contentHashHex(text: string): Promise<string> {
    const subtle: SubtleCrypto | undefined = globalThis.crypto?.subtle
    if (subtle == undefined) {
        return xxh64Hex(text)
    }
    const digest: ArrayBuffer = await subtle.digest('SHA-256', new TextEncoder().encode(text))
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}
