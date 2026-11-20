import { isInteger, isLosslessNumber, isSafeNumber, parse, stringify } from 'lossless-json'

/**
 * Parses a REST response body for visualisation without losing precision of large integers.
 *
 * evitaDB REST sends `Long` values as JSON numbers (e.g. the formula plan `hash`), which a plain `JSON.parse` would
 * silently round. Integers that do not fit into a JS number exactly become `bigint`, every other number stays a
 * plain `number`, so consumers only need to care about `bigint` where long values are expected.
 *
 * The raw result view keeps showing the original text — this parse is used only by the visualisers.
 *
 * @throws SyntaxError when the body is not valid JSON
 */
export function parseRestResultJson(text: string): unknown {
    return parse(text, null, parseNumber)
}

/**
 * Unsafe integers become `bigint`, every other number a plain `number`.
 */
function parseNumber(value: string): number | bigint {
    if (isInteger(value) && !isSafeNumber(value)) {
        return BigInt(value)
    }
    return Number(value)
}

/**
 * A REST response body parsed once, serving both result views.
 */
export interface ParsedRestResult {
    /**
     * The body pretty-printed with every number carried over as its original text, for the raw view.
     */
    readonly prettyText: string
    /**
     * The body with numbers converted as {@link parseRestResultJson} does, for the visualisers.
     */
    readonly value: unknown
}

/**
 * Parses a REST response body once — keeping every number as its original text — and derives both the
 * pretty-printed raw text and the visualiser value from that single parse.
 *
 * @throws SyntaxError when the body is not valid JSON
 */
export function parseRestResult(text: string): ParsedRestResult {
    const lossless: unknown = parse(text)
    return {
        prettyText: stringify(lossless, undefined, 2) ?? text,
        value: toVisualisableValue(lossless)
    }
}

function toVisualisableValue(value: unknown): unknown {
    if (isLosslessNumber(value)) {
        return parseNumber(value.value)
    }
    if (Array.isArray(value)) {
        return value.map(item => toVisualisableValue(item))
    }
    if (value != null && typeof value === 'object') {
        const converted: Record<string, unknown> = {}
        for (const [key, item] of Object.entries(value)) {
            converted[key] = toVisualisableValue(item)
        }
        return converted
    }
    return value
}
