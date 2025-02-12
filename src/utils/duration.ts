const humanDurationPartPattern: RegExp = /^(\d+)(h|min|s|ms)$/
const hourInMs: bigint = BigInt(60 * 60 * 1000)
const minuteInMs: bigint = BigInt(60 * 1000)
const secondInMs: bigint = BigInt(1000)

/**
 * Parses duration in human format e.g.: 1h 23min 22ms
 */
export function parseHumanDurationToMs(humanDuration: string): bigint {
    if (humanDuration.length === 0) {
        throw new Error('Empty duration.')
    }
    let durationInMs: bigint = 0n
    for (const humanDurationPart of humanDuration.split(/\s+/)) {
        const match: RegExpMatchArray | null = humanDurationPart.match(humanDurationPartPattern)
        if (match == undefined) {
            throw new Error('Invalid duration format')
        }

        const value: bigint = BigInt(match[1])
        const unit: string = match[2]

        switch (unit) {
            case 'h': durationInMs += value * hourInMs; break
            case 'min': durationInMs += value * minuteInMs; break
            case 's': durationInMs += value * secondInMs; break
            case 'ms': durationInMs += value; break
            default: throw new Error(`Unsupported duration unit '${unit}'.`)
        }
    }

    return durationInMs
}
