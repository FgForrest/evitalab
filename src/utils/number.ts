/**
 * A constant holding the maximum value a {@code long} can
 * have, 2<sup>63</sup>-1.
 */
export const int64MaxValue: bigint = 0x7fffffffffffffffn

export function round(n: number, decimalPlaces: number): number {
    const multiplier: number = Math.pow(10, decimalPlaces)
    return Math.round(n * multiplier) / multiplier
}

export const humanCountPattern: RegExp = /^(\d+(?:[,.]\d+)?)\s*([kMGT]?)$/

/**
 * Parses count with optional unit prefix, e.g. 123, 123k, 123G and so on.
 */
export function parseHumanCountToNumber(humanCount: string): number {
    if (!humanCountPattern.test(humanCount)) {
        throw new Error('Invalid count format.')
    }
    const exec: RegExpExecArray | null = humanCountPattern.exec(humanCount)
    if (exec == undefined) {
        throw new Error('Invalid count format.')
    }

    const parsedFormattedNumber: string = exec[1]
    const parsedUnitPrefix: string = exec[2]

    const formattedNumber: number = Number(parsedFormattedNumber)
    if (Number.isNaN(formattedNumber)) {
        throw new Error('Invalid number.')
    }

    switch (parsedUnitPrefix) {
        case 'T': return formattedNumber * 1_000_000_000_000
        case 'G': return formattedNumber * 1_000_000_000
        case 'M': return formattedNumber * 1_000_000
        case 'k': return formattedNumber * 1_000
        case undefined:
        case '': return formattedNumber
        default: throw new Error('Invalid unit prefix')
    }
}

/**
 * Parses count with optional unit prefix, e.g. 123, 123k, 123G and so on.
 */
export function parseHumanCountToBigInt(formattedCount: string): [bigint, boolean] {
    if (!humanCountPattern.test(formattedCount)) {
        throw new Error('Invalid count format.')
    }
    const exec: RegExpExecArray | null = humanCountPattern.exec(formattedCount)
    if (exec == undefined) {
        throw new Error('Invalid count format.')
    }

    const parsedFormattedNumber: string = exec[1]
    const parsedUnitPrefix: string = exec[2]

    switch (parsedUnitPrefix) {
        case 'T': return scaleParsedFormattedNumberToBigInt(parsedFormattedNumber, 1000, 4)
        case 'G': return scaleParsedFormattedNumberToBigInt(parsedFormattedNumber, 1000, 3)
        case 'M': return scaleParsedFormattedNumberToBigInt(parsedFormattedNumber, 1000, 2)
        case 'k': return scaleParsedFormattedNumberToBigInt(parsedFormattedNumber, 1000, 1)
        case undefined:
        case '': return scaleParsedFormattedNumberToBigInt(parsedFormattedNumber, 1, 0)
        default: throw new Error('Invalid unit prefix')
    }
}

export const humanByteSizePattern: RegExp = /^(\d+(?:[,.]\d+)?)\s*([kMG]|(Ki)|(Mi)|(Gi))?$/

/**
 * Parses byte size with optional unit prefix, e.g. 123, 123k, 123G, 123Gi and so on.
 */
export function parseHumanByteSizeToNumber(formattedByteSize: string): [number, boolean] {
    const parsed: [bigint, boolean] = parseHumanByteSizeToBigInt(formattedByteSize)
    return [Number(parsed[0]), parsed[1]]
}

/**
 * Parses byte size with optional unit prefix, e.g. 123, 123k, 123G, 123Gi and so on.
 */
export function parseHumanByteSizeToBigInt(formattedByteSize: string): [bigint, boolean] {
    if (!humanByteSizePattern.test(formattedByteSize)) {
        throw new Error('Invalid byte size format.')
    }
    const exec: RegExpExecArray | null = humanByteSizePattern.exec(formattedByteSize)
    if (exec == undefined) {
        throw new Error('Invalid byte size format.')
    }

    const parsedFormattedNumber: string = exec[1]
    const parsedUnitPrefix: string = exec[2]

    switch (parsedUnitPrefix) {
        case 'G': return scaleParsedFormattedNumberToBigInt(parsedFormattedNumber, 1000, 3)
        case 'Gi': return scaleParsedFormattedNumberToBigInt(parsedFormattedNumber, 1024, 3)
        case 'M': return scaleParsedFormattedNumberToBigInt(parsedFormattedNumber, 1000, 2)
        case 'Mi': return scaleParsedFormattedNumberToBigInt(parsedFormattedNumber, 1024, 2)
        case 'k': return scaleParsedFormattedNumberToBigInt(parsedFormattedNumber, 1000, 1)
        case 'Ki': return scaleParsedFormattedNumberToBigInt(parsedFormattedNumber, 1024, 1)
        case undefined:
        case '': return scaleParsedFormattedNumberToBigInt(parsedFormattedNumber, 1, 0)
        default: throw new Error('Invalid unit prefix')
    }
}

function scaleParsedFormattedNumberToBigInt(parsedFormattedNumber: string,
                                            base: number,
                                            exponent: number): [bigint, boolean] {
    const formattedNumberParts: string[] = parsedFormattedNumber.split('.')

    let preDecimalPointCount: bigint = BigInt(formattedNumberParts[0])
    let postDecimalPointCount: number = formattedNumberParts.length > 1
        ? Number(`0.${formattedNumberParts[1]}`)
        : 0

    preDecimalPointCount *= BigInt(base) ** BigInt(exponent)
    postDecimalPointCount *= base ** exponent
    const rounded: boolean = !Number.isInteger(postDecimalPointCount)
    postDecimalPointCount = Math.round(postDecimalPointCount)

    return [
        preDecimalPointCount + BigInt(postDecimalPointCount),
        rounded
    ]
}
