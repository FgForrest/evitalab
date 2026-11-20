import { List } from 'immutable'
import type { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import type { QueryTelemetryMetrics } from '@/modules/database-driver/request-response/data/QueryTelemetryMetrics'
import type { VisualisedTelemetryStep } from './VisualisedTelemetryStep'
import type { TelemetryPhaseShare } from './TelemetryPhaseShare'

/**
 * The whole query telemetry prepared for the visualiser: the step tree, a flat pre-order index of it, the total and
 * the phase share bar. Built by `visualiseQueryTelemetry`.
 */
export class VisualisedQueryTelemetry {
    readonly root: VisualisedTelemetryStep
    /**
     * All steps in pre-order (root first).
     */
    readonly steps: List<VisualisedTelemetryStep>
    /**
     * Nanoseconds the whole query took (the root's `spent`).
     */
    readonly total: number
    /**
     * Segments of the phase share bar in the order planning, execution, fetching, root self time.
     */
    readonly phaseShares: List<TelemetryPhaseShare>
    /**
     * Optional GraphQL fields the query did not select (dotted paths), empty for evitaQL.
     */
    readonly missingSelections: List<string>
    /**
     * Wall-clock instant the query began, `undefined` when the GraphQL selection omitted `startedAt`.
     */
    readonly startedAt: OffsetDateTime | undefined
    private readonly stepIndex: Map<string, VisualisedTelemetryStep>

    constructor(root: VisualisedTelemetryStep,
                steps: List<VisualisedTelemetryStep>,
                total: number,
                phaseShares: List<TelemetryPhaseShare>,
                missingSelections: List<string>,
                startedAt: OffsetDateTime | undefined) {
        this.root = root
        this.steps = steps
        this.total = total
        this.phaseShares = phaseShares
        this.missingSelections = missingSelections
        this.startedAt = startedAt
        this.stepIndex = new Map(steps.map(it => [it.id, it] as const))
    }

    get metrics(): QueryTelemetryMetrics | undefined {
        return this.root.metrics
    }

    /**
     * Whether any step carries a formula plan, i.e. the profile was taken with `queryTelemetry(PLAN)`.
     */
    get hasPlan(): boolean {
        return this.steps.some(it => it.plan != undefined)
    }

    get maxDepth(): number {
        return this.steps.reduce((max, it) => Math.max(max, it.depth), 0)
    }

    getStep(id: string): VisualisedTelemetryStep | undefined {
        return this.stepIndex.get(id)
    }

    /**
     * Steps from the root down to the step with `id`, both included; empty when the id is unknown.
     */
    pathTo(id: string): List<VisualisedTelemetryStep> {
        const path: VisualisedTelemetryStep[] = []
        let current: VisualisedTelemetryStep | undefined = this.stepIndex.get(id)
        while (current != undefined) {
            path.unshift(current)
            current = current.parentId == undefined ? undefined : this.stepIndex.get(current.parentId)
        }
        return List(path)
    }

    /**
     * Number of steps in the subtree rooted at `step`, the step included.
     */
    subtreeSize(step: VisualisedTelemetryStep): number {
        return 1 + step.children.reduce((sum, child) => sum + this.subtreeSize(child), 0)
    }
}
