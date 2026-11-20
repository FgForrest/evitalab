import { List } from 'immutable'
import { QueryPhase } from '@/modules/database-driver/request-response/data/QueryPhase'
import type { QueryTelemetryMetrics } from '@/modules/database-driver/request-response/data/QueryTelemetryMetrics'
import type { FormulaPlan } from '@/modules/database-driver/request-response/data/FormulaPlan'
import { shortQueryPhaseName, TelemetryPhaseGroup, telemetryPhaseGroupOf } from './TelemetryPhaseGroup'
import type { TelemetryAlternativeVerdict } from './TelemetryAlternativeVerdict'

const referenceNamePattern: RegExp = /Reference name: `?([^`]+)`?/

/**
 * One step of the visualised telemetry tree: a {@link QueryTelemetry} step with everything the flamegraph, the step
 * cards and the tab strip need precomputed.
 *
 * Durations are `number` nanoseconds (exact below 2^53 ns) because they only feed ratios and layout; identity-bearing
 * values (`plan.hash`) stay `bigint` in the referenced driver objects.
 */
export class VisualisedTelemetryStep {
    /**
     * Stable id: the operation path from the root with sibling ordinals, e.g.
     * `OVERALL/EXECUTION[1]/FETCHING[2]/FETCHING_REFERENCES[0]`. Equal for the same query shape across runs.
     */
    readonly id: string
    readonly parentId: string | undefined
    /**
     * Distance from the root, which is `0`.
     */
    readonly depth: number
    /**
     * Position among the siblings, `0`-based.
     */
    readonly ordinal: number
    readonly operation: QueryPhase
    /**
     * Nanoseconds since the root began.
     */
    readonly start: number
    /**
     * Nanoseconds spent in the step including its children.
     */
    readonly spent: number
    /**
     * Nanoseconds spent in the step itself, `undefined` when the GraphQL selection omitted `selfTime`.
     */
    readonly self: number | undefined
    /**
     * {@link spent} relative to the whole query, `0` … `1`.
     */
    readonly shareOfTotal: number
    /**
     * {@link spent} relative to the parent step, `1` on the root.
     */
    readonly shareOfParent: number
    readonly arguments: List<string>
    /**
     * Query-wide measurements; the root only.
     */
    readonly metrics: QueryTelemetryMetrics | undefined
    /**
     * Formula plan recorded on this step: the executed plan on the root, a candidate on an eligible alternative.
     */
    readonly plan: FormulaPlan | undefined
    /**
     * Verdict of an index-selection candidate; set on `PLANNING_FILTER_ALTERNATIVE` steps only.
     */
    readonly alternative: TelemetryAlternativeVerdict | undefined
    /**
     * Id of the step whose plan the plan action of this step opens: the step itself, or the root for the winning
     * alternative (whose candidate plan is the very formula instance that was executed). `undefined` when there is
     * nothing to open.
     */
    readonly planStepId: string | undefined
    readonly children: List<VisualisedTelemetryStep>

    constructor(id: string,
                parentId: string | undefined,
                depth: number,
                ordinal: number,
                operation: QueryPhase,
                start: number,
                spent: number,
                self: number | undefined,
                shareOfTotal: number,
                shareOfParent: number,
                args: List<string>,
                metrics: QueryTelemetryMetrics | undefined,
                plan: FormulaPlan | undefined,
                alternative: TelemetryAlternativeVerdict | undefined,
                planStepId: string | undefined,
                children: List<VisualisedTelemetryStep>) {
        this.id = id
        this.parentId = parentId
        this.depth = depth
        this.ordinal = ordinal
        this.operation = operation
        this.start = start
        this.spent = spent
        this.self = self
        this.shareOfTotal = shareOfTotal
        this.shareOfParent = shareOfParent
        this.arguments = args
        this.metrics = metrics
        this.plan = plan
        this.alternative = alternative
        this.planStepId = planStepId
        this.children = children
    }

    get group(): TelemetryPhaseGroup {
        return telemetryPhaseGroupOf(this.operation)
    }

    get firstArgument(): string | undefined {
        return this.arguments.first()
    }

    /**
     * Name of the fetched reference of a `FETCHING_REFERENCES` step, parsed from its `Reference name: …` argument.
     */
    get referenceName(): string | undefined {
        if (this.operation !== QueryPhase.FetchingReferences) {
            return undefined
        }
        return this.firstArgument?.match(referenceNamePattern)?.[1]
    }

    /**
     * Value of the `sortResolution=…` argument of `EXECUTION_SORT_AND_SLICE`.
     */
    get sortResolution(): string | undefined {
        if (this.operation !== QueryPhase.ExecutionSortAndSlice) {
            return undefined
        }
        const argument: string | undefined = this.arguments.find(it => it.startsWith('sortResolution'))
        return argument?.substring(argument.indexOf('=') + 1)
    }

    /**
     * `1`-based position of an index-selection candidate among its siblings, `undefined` on other steps. The
     * components render it as the localised alternative label instead of {@link label}.
     */
    get alternativeOrdinal(): number | undefined {
        return this.operation === QueryPhase.PlanningFilterAlternative ? this.ordinal + 1 : undefined
    }

    /**
     * Technical label of the step: the phase without its group prefix, or the reference name for reference fetching.
     * Index-selection candidates are labelled from {@link alternativeOrdinal} by the components.
     */
    get label(): string {
        const referenceName: string | undefined = this.referenceName
        if (referenceName != undefined) {
            return referenceName
        }
        return shortQueryPhaseName(this.operation)
    }

    /**
     * The first argument with the boilerplate prefixes and suffixes of index-selection and reference-fetching
     * arguments removed, short enough for a card line.
     */
    get conciseArgument(): string | undefined {
        return this.firstArgument
            ?.replace(/^Index type: /, '')
            .replace(/, estimated costs -?\d+$/, '')
            .replace(/^Reference name: /, '')
    }
}
