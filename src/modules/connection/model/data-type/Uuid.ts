//TODO: Add docs
export class Uuid {
    readonly code: string

    constructor(code: string) {
        this.code = code
    }

    private static bigintToHex(num: bigint): string {
        if (num) return num.toString(16).padStart(16, '0')
        else return ''
    }

    static createUUID(
        mostSignificantBits: bigint,
        leastSignificantBits: bigint
    ): Uuid {
        const msbHex = this.bigintToHex(mostSignificantBits)
        const lsbHex = this.bigintToHex(leastSignificantBits)

        return new Uuid(
            `${msbHex.substring(0, 8)}-${msbHex.substring(
                8,
                12
            )}-${msbHex.substring(12, 16)}-${lsbHex.substring(
                0,
                4
            )}-${lsbHex.substring(4)}`
        )
    }
}
