//TODO: Add docs
import { convertUuidBitsToCode, convertUuidCodeToBits } from '@/utils/uuid'

export class Uuid {
    readonly code: string
    readonly mostSignificantBits: bigint
    readonly leastSignificantBits: bigint

    private constructor(code: string, mostSignificantBits: bigint, leastSignificantBits: bigint) {
        this.code = code
        this.leastSignificantBits = leastSignificantBits
        this.mostSignificantBits = mostSignificantBits
    }

    static fromBits(mostSignificantBits: bigint, leastSignificantBits: bigint): Uuid {
        return new Uuid(
            convertUuidBitsToCode(mostSignificantBits, leastSignificantBits),
            mostSignificantBits,
            leastSignificantBits
        )
    }

    static fromCode(code: string): Uuid {
        const bits: { mostSignificantBits: bigint; leastSignificantBits: bigint } = convertUuidCodeToBits(code)
        return new Uuid(code, bits.mostSignificantBits, bits.leastSignificantBits)
    }

    toString(): string {
        return this.code
    }
}
