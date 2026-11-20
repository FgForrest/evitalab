import { LabError } from '@/modules/base/exception/LabError'

/**
 * Why a console could not add the query telemetry request to a query.
 */
export enum QueryTelemetryInjectionFailureReason {
    /**
     * The query has syntax errors (or contains no query at all), so there is no reliable place to put the request at.
     */
    Unparseable = 'unparseable',
    /**
     * The query is valid but contains nothing that can collect telemetry (e.g. a GraphQL document without any
     * `query*` field).
     */
    NoTarget = 'noTarget'
}

/**
 * Thrown by the console query telemetry injectors when the telemetry request cannot be added to a query. The caller
 * is expected to run the original query as is and only warn the user.
 */
export class QueryTelemetryInjectionError extends LabError {

    readonly reason: QueryTelemetryInjectionFailureReason

    constructor(reason: QueryTelemetryInjectionFailureReason, detail: string) {
        super(
            'QueryTelemetryInjectionError',
            `Could not add query telemetry to the query: ${detail}`,
            detail
        )
        this.reason = reason
    }
}
