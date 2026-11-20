import { errorMessage } from '@/utils/error'
import {
    QueryTelemetryInjectionError,
    QueryTelemetryInjectionFailureReason
} from '@/modules/console/exception/QueryTelemetryInjectionError'

/**
 * Value of the `queryTelemetry` requirement requesting the full telemetry including the formula plan.
 */
const queryTelemetryLevel: string = 'PLAN'

/**
 * Returns a copy of a REST query body that additionally requests the query telemetry
 * (`"require": { "queryTelemetry": "PLAN" }`).
 *
 * - a blank body is treated as `{}`;
 * - the body must be a JSON object, and its `require`, when present, an object too — anything else throws
 *   {@link QueryTelemetryInjectionError} with reason `Unparseable`;
 * - an already present `queryTelemetry` (with any value) is left alone and the **original text** is returned, so
 *   the injection is idempotent; otherwise the body is re-serialized (pretty-printed).
 *
 * Numbers are carried over through the native JSON parser, so integers above 2^53 in the body would lose precision
 * in the sent copy — evitaDB query bodies practically never contain such values.
 */
export function injectQueryTelemetry(body: string): string {
    const source: string = body.trim().length === 0 ? '{}' : body
    let parsed: unknown
    try {
        parsed = JSON.parse(source)
    } catch (e) {
        throw new QueryTelemetryInjectionError(QueryTelemetryInjectionFailureReason.Unparseable, errorMessage(e))
    }
    if (!isJsonObject(parsed)) {
        throw new QueryTelemetryInjectionError(
            QueryTelemetryInjectionFailureReason.Unparseable,
            'the body is not a JSON object'
        )
    }

    const require: unknown = parsed['require']
    if (require != undefined && !isJsonObject(require)) {
        throw new QueryTelemetryInjectionError(
            QueryTelemetryInjectionFailureReason.Unparseable,
            'the `require` of the body is not a JSON object'
        )
    }
    if (require != undefined && 'queryTelemetry' in require) {
        return body
    }

    const injected: Record<string, unknown> = {
        ...parsed,
        require: {
            ...(require ?? {}),
            queryTelemetry: queryTelemetryLevel
        }
    }
    return JSON.stringify(injected, undefined, 2)
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
    return value != null && typeof value === 'object' && !Array.isArray(value)
}
