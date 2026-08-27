import XXH from 'xxhashjs'
import type { HashObject } from 'xxhashjs'

/**
 * Shared across every call, which is only safe because `digest()` re-initializes the hasher with its seed
 * before returning — an instance therefore never carries state from one hashed value into the next.
 */
const hasher: HashObject = XXH.h64()

/**
 * Returns the hexadecimal xxHash64 of the value.
 *
 * The default seed (0) is deliberate and must not change: the produced hashes namespace persisted storage
 * (database and local storage names), so a different seed would silently abandon everything a user has stored.
 */
export function xxh64Hex(value: string): string {
    return hasher.update(value).digest().toString(16)
}
