import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { limitToSigned64Bits } from '@/utils/bigint'

/**
 * Method for converting UUID bits to canonical string representation
 * @param mostSignificantBits
 * @param leastSignificantBits
 */
export function convertUuidBitsToCode(mostSignificantBits: bigint, leastSignificantBits: bigint): string {
    return `${digits(mostSignificantBits >> 32n, 8n)}-${digits(mostSignificantBits >> 16n, 4n)}-${digits(mostSignificantBits, 4n)}-${digits(leastSignificantBits >> 48n, 4n)}-${digits(leastSignificantBits, 12n)}`;
}

function digits(val: bigint, ds: bigint): string {
    const hi = 1n << (ds * 4n);
    return (hi | (val & (hi - 1n))).toString(16).substring(1);
}

/**
 * Factory method for converting UUIDs from the canonical string
 * representation to 64-bit bits.
 *
 * Inspired by `com.fasterxml.uuid.impl.UUIDUtil`.
 * <a href="https://github.com/cowtowncoder/java-uuid-generator">UUID Utils from CowTownCoder</a>. Thanks.
 *
 * @param code String that contains the canonical representation of
 *   the UUID to build; 36-char string (see UUID specs for details).
 *   Hex-chars may be in upper-case too; UUID class will always output
 *   them in lowercase.
 */
export function convertUuidCodeToBits(code: string): { mostSignificantBits: bigint, leastSignificantBits: bigint } {
    if (code.length != 36) {
        throw new UnexpectedError('UUID has to be represented by the standard 36-char representation')
    }

    let lo: bigint = 0n
    let hi: bigint = 0n

    for (let i = 0, j = 0; i < 36; ++j) {

        // Need to bypass hyphens:
        switch (i) {
            case 8:
            case 13:
            case 18:
            case 23: {
                if (code.charAt(i) !== '-') {
                    throw new UnexpectedError('UUID has to be represented by the standard 36-char representation')
                }
                ++i;
            }
        }
        let curr: bigint;
        let c: number = code.charCodeAt(i);

        if (c >= '0'.charCodeAt(0) && c <= '9'.charCodeAt(0)) {
            curr = BigInt(c - '0'.charCodeAt(0));
        } else if (c >= 'a'.charCodeAt(0) && c <= 'f'.charCodeAt(0)) {
            curr = BigInt(c - 'a'.charCodeAt(0) + 10);
        } else if (c >= 'A'.charCodeAt(0) && c <= 'F'.charCodeAt(0)) {
            curr = BigInt(c - 'A'.charCodeAt(0) + 10);
        } else {
            throw new UnexpectedError(`Non-hex character at #${i}: '${String.fromCharCode(c)}' (value 0x${c.toString(16)})`);
        }
        curr = (curr << 4n);

        c = code.charCodeAt(++i);

        if (c >= '0'.charCodeAt(0) && c <= '9'.charCodeAt(0)) {
            curr |= BigInt(c - '0'.charCodeAt(0));
        } else if (c >= 'a'.charCodeAt(0) && c <= 'f'.charCodeAt(0)) {
            curr |= BigInt(c - 'a'.charCodeAt(0) + 10);
        } else if (c >= 'A'.charCodeAt(0) && c <= 'F'.charCodeAt(0)) {
            curr |= BigInt(c - 'A'.charCodeAt(0) + 10);
        } else {
            throw new UnexpectedError(`Non-hex character at #${i}: '${String.fromCharCode(c)}' (value 0x${c.toString(16)})`);
        }
        if (j < 8) {
            hi = (hi << 8n) | curr;
        } else {
            lo = (lo << 8n) | curr;
        }
        ++i;
    }
    // we need to limit the bits to 64-bit because the server cannot handle unlimited integers
    return { mostSignificantBits: limitToSigned64Bits(hi), leastSignificantBits: limitToSigned64Bits(lo) };
}
