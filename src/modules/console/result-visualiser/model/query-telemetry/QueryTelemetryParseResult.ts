import { List } from 'immutable'
import { QueryTelemetry } from '@/modules/database-driver/request-response/data/QueryTelemetry'

/**
 * Outcome of parsing the query telemetry of one query result: either {@link ParsedQueryTelemetry} or
 * {@link PartialQueryTelemetrySelection}. Narrow with `instanceof`.
 */
export type QueryTelemetryParseResult = ParsedQueryTelemetry | PartialQueryTelemetrySelection

/**
 * The telemetry tree could be built.
 *
 * {@link missingSelections} lists the optional fields the query did not select (GraphQL only, dotted paths such as
 * `selfTime` or `plan.hash`). Their values are `undefined` in the tree (`start` is reconstructed sequentially
 * instead), so the UI can mark the affected rows as "not selected" rather than "not measured". Always empty for
 * evitaQL, whose telemetry is always complete.
 */
export class ParsedQueryTelemetry {
    readonly telemetry: QueryTelemetry
    readonly missingSelections: List<string>

    constructor(telemetry: QueryTelemetry, missingSelections: List<string> = List()) {
        this.telemetry = telemetry
        this.missingSelections = missingSelections
    }
}

/**
 * The telemetry could not be built because the query did not select fields the tree cannot exist without (GraphQL
 * only: `level`, `operation`, `spentTime`). Rendered as a note telling the user which fields to add - not as an
 * error.
 */
export class PartialQueryTelemetrySelection {
    /**
     * Required fields missing from the selection, in the order `level`, `operation`, `spentTime`.
     */
    readonly missingRequiredSelections: List<string>

    constructor(missingRequiredSelections: List<string>) {
        this.missingRequiredSelections = missingRequiredSelections
    }
}
