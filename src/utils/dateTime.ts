import { DateTime } from 'luxon'

/**
 * Extracts ISO time offset from zoned date time
 */
export function timeOffsetFrom(dateTime: DateTime): string {
    return dateTime.toFormat('ZZ')
}

/**
 * Converts an ISO time offset (e.g. `Z`, `+02:00`) into a zone specifier accepted by Luxon.
 * Luxon does not recognize bare ISO offsets as zones, so they are normalized to the `UTC±HH:MM` form.
 */
export function toLuxonZone(offset: string): string {
    return offset === 'Z' || offset === ''
        ? 'UTC'
        : `UTC${offset}`
}

/**
 * Result of parsing a manually entered date time string.
 */
export interface ParsedDateTimeInput {
    /**
     * The parsed date time. When the input carried no explicit time offset, only the wall-clock
     * components (year through second) are meaningful — the zone is just the parsing default.
     */
    readonly dateTime: DateTime
    /**
     * ISO time offset (`±HH:MM`) explicitly present in the input, or undefined when the input
     * did not specify one and the caller must decide how to interpret the wall-clock time.
     */
    readonly explicitOffset: string | undefined
}

/**
 * Trailing zone name emitted by `Intl` long time styles, e.g. ` GMT+2`, ` UTC`, ` GMT+05:30`.
 * Luxon cannot parse localized zone names, so such suffix is stripped upfront and converted
 * to an explicit offset.
 */
const trailingZoneNamePattern = /\s*(?:GMT|UTC)(?:([+-])(\d{1,2})(?::?(\d{2}))?)?$/i

/**
 * Ordered Luxon macro-token formats used as locale-aware parse attempts (seconds-bearing
 * formats first so that seconds are not silently dropped).
 */
const macroTokenFormats: string[] = [
    'FF', 'F', 'ff', 'f',
    'DD TT', 'DD tt', 'D TT', 'D tt',
    'DD T', 'DD t', 'D T', 'D t',
    'DD', 'D'
]

/**
 * `Intl` style combinations from which locale-specific parse patterns are derived. They cover
 * the formats evitaLab itself uses for displaying date times (so displayed values can be copied
 * back in), plus common short variants.
 */
const intlStyleCombinations: Intl.DateTimeFormatOptions[] = [
    { dateStyle: 'full', timeStyle: 'medium' },
    { dateStyle: 'long', timeStyle: 'medium' },
    { dateStyle: 'medium', timeStyle: 'medium' },
    { dateStyle: 'short', timeStyle: 'medium' },
    { dateStyle: 'medium', timeStyle: 'short' },
    { dateStyle: 'short', timeStyle: 'short' },
    { dateStyle: 'medium' },
    { dateStyle: 'short' }
]

/**
 * Reference date with unambiguous component values (Feb 3 2001, 13:05:09) used to reverse-engineer
 * `Intl` formats into Luxon parse patterns.
 */
const intlReferenceDate: Date = new Date(2001, 1, 3, 13, 5, 9)

/**
 * Parses a manually entered/pasted date time string. Tries, in order: ISO 8601, SQL-ish
 * (`2007-12-03 10:15:30`), RFC 2822 and a set of locale-based formats (Luxon macro tokens plus
 * patterns derived from `Intl` for the given locale). A trailing localized zone name (`GMT+2`,
 * `UTC`, ...) is recognized and converted to an explicit offset. Fractional seconds are ignored.
 *
 * @param input raw user input
 * @param locale BCP 47 locale used for locale-based formats; defaults to the environment locale
 * @returns parsed result, or undefined when the input matches no supported format
 */
export function parseDateTimeInput(input: string, locale?: string): ParsedDateTimeInput | undefined {
    // Intl formats time with narrow no-break spaces which users' pasted text may or may not preserve
    let text: string = input.trim().replace(/[\u00a0\u202f]/g, ' ')
    if (text.length === 0) {
        return undefined
    }

    let strippedOffset: string | undefined = undefined
    const zoneNameMatch: RegExpMatchArray | null = text.match(trailingZoneNamePattern)
    if (zoneNameMatch != null) {
        const sign: string = zoneNameMatch[1] ?? '+'
        const hours: string = (zoneNameMatch[2] ?? '0').padStart(2, '0')
        const minutes: string = zoneNameMatch[3] ?? '00'
        strippedOffset = `${sign}${hours}:${minutes}`
        text = text.substring(0, zoneNameMatch.index!).trim()
        if (text.length === 0) {
            return undefined
        }
    }

    const attempts: (() => ParsedDateTimeInput | undefined)[] = [
        () => tryParse((zone) => DateTime.fromISO(text, { setZone: true, zone })),
        () => tryParse((zone) => DateTime.fromSQL(text, { setZone: true, zone })),
        () => tryParse((zone) => DateTime.fromRFC2822(text, { setZone: true, zone })),
        ...localeFormats(locale).map((format) => () =>
            tryParse((zone) => DateTime.fromFormat(text, format, { setZone: true, zone, locale })))
    ]
    for (const attempt of attempts) {
        const parsed: ParsedDateTimeInput | undefined = attempt()
        if (parsed != undefined) {
            return strippedOffset == undefined
                ? parsed
                : { dateTime: parsed.dateTime, explicitOffset: parsed.explicitOffset ?? strippedOffset }
        }
    }
    return undefined
}

/**
 * Runs a single parse attempt and detects whether the input carried its own time offset by
 * parsing twice with two different default zones — when both results agree on the offset,
 * the offset must have come from the input itself.
 */
function tryParse(parse: (zone: string) => DateTime): ParsedDateTimeInput | undefined {
    const inUtc: DateTime = parse('UTC')
    if (!inUtc.isValid) {
        return undefined
    }
    const inOtherZone: DateTime = parse('UTC+05:45')
    const explicitOffset: string | undefined = inUtc.offset === inOtherZone.offset
        ? timeOffsetFrom(inUtc)
        : undefined
    return { dateTime: inUtc, explicitOffset }
}

/**
 * Builds the ordered list of locale-based parse formats: `Intl`-derived patterns first (they
 * match the locale exactly), Luxon macro tokens as fallback.
 */
function localeFormats(locale?: string): string[] {
    const formats: Set<string> = new Set()
    for (const styleCombination of intlStyleCombinations) {
        const pattern: string | undefined = intlPattern(locale, styleCombination)
        if (pattern != undefined) {
            formats.add(pattern)
        }
    }
    for (const macroFormat of macroTokenFormats) {
        formats.add(macroFormat)
    }
    return Array.from(formats)
}

/**
 * Derives a Luxon parse pattern from an `Intl` format by formatting a reference date and mapping
 * the resulting parts to Luxon tokens. Returns undefined for formats containing unsupported parts.
 */
function intlPattern(locale: string | undefined, options: Intl.DateTimeFormatOptions): string | undefined {
    let parts: Intl.DateTimeFormatPart[]
    try {
        parts = new Intl.DateTimeFormat(locale != undefined ? locale : [], options)
            .formatToParts(intlReferenceDate)
    } catch (_e) {
        return undefined
    }

    let pattern: string = ''
    for (const part of parts) {
        const numeric: boolean = /^\d+$/.test(part.value)
        switch (part.type) {
            case 'year':
                pattern += part.value.length === 2 ? 'yy' : 'yyyy'
                break
            case 'month':
                if (numeric) {
                    pattern += part.value.length === 2 ? 'MM' : 'M'
                } else {
                    pattern += part.value.length <= 4 ? 'MMM' : 'MMMM'
                }
                break
            case 'day':
                pattern += part.value.length === 2 ? 'dd' : 'd'
                break
            case 'weekday':
                pattern += part.value.length <= 3 ? 'EEE' : 'EEEE'
                break
            case 'hour':
                if (Number.parseInt(part.value) === intlReferenceDate.getHours()) {
                    pattern += part.value.length === 2 ? 'HH' : 'H'
                } else {
                    pattern += part.value.length === 2 ? 'hh' : 'h'
                }
                break
            case 'minute':
                pattern += part.value.length === 2 ? 'mm' : 'm'
                break
            case 'second':
                pattern += part.value.length === 2 ? 'ss' : 's'
                break
            case 'dayPeriod':
                pattern += 'a'
                break
            case 'literal':
                pattern += `'${part.value.replace(/[\u00a0\u202f]/g, ' ').replace(/'/g, '\'\'')}'`
                break
            default:
                // era, timeZoneName, ... — cannot be expressed as a Luxon parse token
                return undefined
        }
    }
    return pattern
}
