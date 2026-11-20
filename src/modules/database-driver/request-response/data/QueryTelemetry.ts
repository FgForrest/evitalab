import { List } from 'immutable'
import { QueryPhase } from './QueryPhase'
import { QueryTelemetryMetrics } from './QueryTelemetryMetrics'
import { FormulaPlan } from './FormulaPlan'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'

/**
 * One step of the query telemetry tree: how long a query processing phase took and what it consisted of. The root
 * step is always {@link QueryPhase.Overall}; requested by the `queryTelemetry` require constraint.
 *
 * All durations are nanoseconds as `bigint` (int64 on the wire). Converting them to `number` for ratios and layout
 * is safe (exact below 2^53 ns), the conversion belongs to the view model.
 */
export class QueryTelemetry {
    /**
     * Phase this step measures.
     */
    readonly operation: QueryPhase
    /**
     * Nanoseconds elapsed since the root step began - the root itself reports `0`. Not a wall-clock timestamp.
     * `(start, start + spentTime)` is the step's bar on a timeline.
     */
    readonly start: bigint
    /**
     * Duration in nanoseconds covering this step and everything nested below it.
     */
    readonly spentTime: bigint
    /**
     * Nanoseconds this step spent on its own work (its {@link spentTime} less the time of its direct children),
     * derived by the server. Always sent by gRPC; `undefined` only when a GraphQL selection omitted it - it is never
     * derived client-side.
     */
    readonly selfTime: bigint | undefined
    /**
     * Arguments of the phase, prose such as `Selected index: …` or `Reference name: \`brand\``.
     */
    readonly arguments: List<string>
    /**
     * Wall-clock instant the query began. Set on the root step only.
     */
    readonly startedAt: OffsetDateTime | undefined
    /**
     * Typed measurements, recorded on the root step only.
     */
    readonly metrics: QueryTelemetryMetrics | undefined
    /**
     * Formula plan of this step: the executed plan on the root, a candidate plan on an eligible
     * `PLANNING_FILTER_ALTERNATIVE`. Absent everywhere else and whenever the plan was not requested.
     */
    readonly plan: FormulaPlan | undefined
    /**
     * Nested steps (operation decomposition), in execution order.
     */
    readonly steps: List<QueryTelemetry>

    constructor(operation: QueryPhase,
                start: bigint,
                spentTime: bigint,
                selfTime: bigint | undefined,
                args: List<string>,
                startedAt: OffsetDateTime | undefined,
                metrics: QueryTelemetryMetrics | undefined,
                plan: FormulaPlan | undefined,
                steps: List<QueryTelemetry>) {
        this.operation = operation
        this.start = start
        this.spentTime = spentTime
        this.selfTime = selfTime
        this.arguments = args
        this.startedAt = startedAt
        this.metrics = metrics
        this.plan = plan
        this.steps = steps
    }
}
