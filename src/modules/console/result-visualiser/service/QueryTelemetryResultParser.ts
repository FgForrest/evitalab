import type { QueryTelemetryParseResult } from '../model/query-telemetry/QueryTelemetryParseResult'

/**
 * Extracts the query telemetry tree of a single query result into the driver's internal
 * {@link QueryTelemetry} model, wrapped in a {@link QueryTelemetryParseResult}.
 *
 * Unlike the other parsers it needs no entity schema and no server access: the telemetry is self-contained.
 * Returns `undefined` when the result carries no telemetry.
 */
export interface QueryTelemetryResultParser<TQueryResult = unknown> {
    parse(queryResult: TQueryResult): QueryTelemetryParseResult | undefined
}
