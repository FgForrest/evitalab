import type { QueryTelemetryResultParser } from '@/modules/console/result-visualiser/service/QueryTelemetryResultParser'
import type { GraphQLResultNode } from '@/modules/database-driver/connector/gql/model/GraphQLResultNode'
import {
    ParsedQueryTelemetry,
    PartialQueryTelemetrySelection,
    type QueryTelemetryParseResult
} from '@/modules/console/result-visualiser/model/query-telemetry/QueryTelemetryParseResult'
import { QueryTelemetry } from '@/modules/database-driver/request-response/data/QueryTelemetry'
import { QueryTelemetryMetrics } from '@/modules/database-driver/request-response/data/QueryTelemetryMetrics'
import { FormulaPlan } from '@/modules/database-driver/request-response/data/FormulaPlan'
import { QueryPhase, queryPhaseFromName } from '@/modules/database-driver/request-response/data/QueryPhase'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { List as ImmutableList } from 'immutable'
import { DateTime } from 'luxon'

/**
 * Fields of a telemetry step the tree cannot be built without.
 */
const requiredStepSelections: readonly string[] = ['level', 'operation', 'spentTime']
/**
 * Fields of a telemetry step the parser reads but tolerates missing. `stepsCount` is tolerated too, but never read.
 */
const optionalStepSelections: readonly string[] = ['start', 'selfTime', 'arguments', 'startedAt', 'metrics', 'plan']
/**
 * Members of `metrics`, all optional.
 */
const metricsSelections: readonly string[] = [
    'estimatedCardinality',
    'actualCardinality',
    'estimatedCost',
    'actualCost',
    'recordsReturned',
    'ioFetchCount',
    'ioFetchedSizeBytes',
    'prefetched'
]
/**
 * Members of a `plan` node that are optional. The plan additionally needs `id` and one of `level` / `childrenCount`
 * to be built at all.
 */
const optionalPlanSelections: readonly string[] = [
    'refTo',
    'hash',
    'description',
    'estimatedCost',
    'actualCost',
    'resultCount'
]

/**
 * A telemetry step whose own data is read but whose children are still being collected from the flat list.
 */
type PendingStep = {
    readonly level: number
    readonly node: GraphQLResultNode
    readonly children: PendingStep[]
}

/**
 * A plan node whose children are still being collected from the flat list.
 */
type PendingPlanNode = {
    readonly node: GraphQLResultNode
    readonly children: PendingPlanNode[]
}

/**
 * {@link QueryTelemetryResultParser} for GraphQL query language.
 *
 * GraphQL transfers the telemetry tree as a **flat pre-order list** with a `level` on each step (root = 1), and each
 * step's `plan` likewise as a flat pre-order list with `level` and `childrenCount`. Both are rebuilt into the nested
 * internal model here. The user writes the selection set, so every field may be missing: missing required fields
 * produce a {@link PartialQueryTelemetrySelection}, missing optional ones are tolerated and listed in
 * {@link ParsedQueryTelemetry.missingSelections} (a missing `start` is reconstructed by laying the steps out
 * sequentially).
 */
export class GraphQLQueryTelemetryResultParser implements QueryTelemetryResultParser {

    parse(queryResult: unknown): QueryTelemetryParseResult | undefined {
        const flatSteps: unknown = (queryResult as GraphQLResultNode | undefined)?.['extraResults']?.['queryTelemetry']
        if (!Array.isArray(flatSteps) || flatSteps.length === 0) {
            return undefined
        }
        const steps: GraphQLResultNode[] = flatSteps as GraphQLResultNode[]

        const missingRequired: string[] = requiredStepSelections
            .filter(field => steps.some(step => step[field] == undefined))
        if (missingRequired.length > 0) {
            return new PartialQueryTelemetrySelection(ImmutableList(missingRequired))
        }

        const root: GraphQLResultNode = steps[0]!
        const missingSelections: string[] = optionalStepSelections.filter(field => !(field in root))

        const metrics: GraphQLResultNode | undefined = steps.find(step => step['metrics'] != undefined)?.['metrics']
        if (metrics != undefined) {
            missingSelections.push(
                ...metricsSelections.filter(field => !(field in metrics)).map(field => `metrics.${field}`)
            )
        }

        let planBuildable: boolean = false
        const firstPlanNode: GraphQLResultNode | undefined = steps
            .find(step => Array.isArray(step['plan']) && step['plan'].length > 0)?.['plan'][0]
        if (firstPlanNode != undefined) {
            const missingPlanStructure: string[] = []
            if (!('id' in firstPlanNode)) {
                missingPlanStructure.push('plan.id')
            }
            if (!('level' in firstPlanNode) && !('childrenCount' in firstPlanNode)) {
                missingPlanStructure.push('plan.level')
            }
            planBuildable = missingPlanStructure.length === 0
            missingSelections.push(
                ...missingPlanStructure,
                ...optionalPlanSelections.filter(field => !(field in firstPlanNode)).map(field => `plan.${field}`)
            )
        }

        const pendingRoot: PendingStep = this.nestSteps(steps)
        const telemetry: QueryTelemetry = this.buildStep(pendingRoot, 0n, planBuildable)
        return new ParsedQueryTelemetry(telemetry, ImmutableList(missingSelections))
    }

    /**
     * Rebuilds the step tree from the flat pre-order list by its `level`s. Returns the first root - the server sends
     * exactly one.
     */
    private nestSteps(steps: GraphQLResultNode[]): PendingStep {
        let root: PendingStep | undefined = undefined
        const stack: PendingStep[] = []
        for (const node of steps) {
            const pending: PendingStep = { level: Number(node['level']), node, children: [] }
            while (stack.length > 0 && stack.at(-1)!.level >= pending.level) {
                stack.pop()
            }
            const parent: PendingStep | undefined = stack.at(-1)
            if (parent != undefined) {
                parent.children.push(pending)
            } else if (root == undefined) {
                root = pending
            }
            stack.push(pending)
        }
        return root!
    }

    /**
     * Builds the immutable step once its children are complete.
     *
     * @param fallbackStart offset used when `start` was not selected: the parent's start for the first child, the
     *        previous sibling's end for the following ones
     */
    private buildStep(pending: PendingStep, fallbackStart: bigint, planBuildable: boolean): QueryTelemetry {
        const node: GraphQLResultNode = pending.node
        const start: bigint = this.toBigInt(node['start']) ?? fallbackStart
        const spentTime: bigint = this.toBigInt(node['spentTime'])!

        const children: QueryTelemetry[] = []
        let nextStart: bigint = start
        for (const childPending of pending.children) {
            const child: QueryTelemetry = this.buildStep(childPending, nextStart, planBuildable)
            children.push(child)
            nextStart = child.start + child.spentTime
        }

        return new QueryTelemetry(
            this.resolveOperation(node['operation']),
            start,
            spentTime,
            this.toBigInt(node['selfTime']),
            ImmutableList((node['arguments'] as string[] | null | undefined) ?? []),
            this.parseStartedAt(node['startedAt']),
            this.buildMetrics(node['metrics']),
            planBuildable ? this.buildPlan(node['plan']) : undefined,
            ImmutableList(children)
        )
    }

    private resolveOperation(operation: unknown): QueryPhase {
        const phase: QueryPhase | undefined = queryPhaseFromName(String(operation))
        if (phase == undefined) {
            throw new UnexpectedError(`Unknown query telemetry operation '${String(operation)}'.`)
        }
        return phase
    }

    private buildMetrics(metrics: GraphQLResultNode | null | undefined): QueryTelemetryMetrics | undefined {
        if (metrics == undefined) {
            return undefined
        }
        return new QueryTelemetryMetrics(
            this.toBigInt(metrics['estimatedCardinality']),
            this.toBigInt(metrics['actualCardinality']),
            this.toBigInt(metrics['estimatedCost']),
            this.toBigInt(metrics['actualCost']),
            this.toBigInt(metrics['recordsReturned']),
            this.toBigInt(metrics['ioFetchCount']),
            this.toBigInt(metrics['ioFetchedSizeBytes']),
            metrics['prefetched'] ?? undefined
        )
    }

    /**
     * Rebuilds the plan tree from its flat pre-order list - by `level` when selected, otherwise by `childrenCount`.
     */
    private buildPlan(flatPlan: GraphQLResultNode[] | null | undefined): FormulaPlan | undefined {
        if (flatPlan == undefined || flatPlan.length === 0) {
            return undefined
        }
        const pendingRoot: PendingPlanNode = flatPlan[0]!['level'] != undefined
            ? this.nestPlanByLevel(flatPlan)
            : this.nestPlanByChildrenCount(flatPlan, { index: 0 })
        return this.buildPlanNode(pendingRoot)
    }

    private nestPlanByLevel(flatPlan: GraphQLResultNode[]): PendingPlanNode {
        let root: PendingPlanNode | undefined = undefined
        const stack: { level: number, pending: PendingPlanNode }[] = []
        for (const node of flatPlan) {
            const level: number = Number(node['level'])
            const pending: PendingPlanNode = { node, children: [] }
            while (stack.length > 0 && stack.at(-1)!.level >= level) {
                stack.pop()
            }
            const parent = stack.at(-1)
            if (parent != undefined) {
                parent.pending.children.push(pending)
            } else if (root == undefined) {
                root = pending
            }
            stack.push({ level, pending })
        }
        return root!
    }

    private nestPlanByChildrenCount(flatPlan: GraphQLResultNode[], cursor: { index: number }): PendingPlanNode {
        const node: GraphQLResultNode = flatPlan[cursor.index]!
        cursor.index++
        const pending: PendingPlanNode = { node, children: [] }
        const childrenCount: number = Number(node['childrenCount'] ?? 0)
        for (let i = 0; i < childrenCount && cursor.index < flatPlan.length; i++) {
            pending.children.push(this.nestPlanByChildrenCount(flatPlan, cursor))
        }
        return pending
    }

    private buildPlanNode(pending: PendingPlanNode): FormulaPlan {
        const node: GraphQLResultNode = pending.node
        return new FormulaPlan(
            Number(node['id']),
            node['refTo'] ?? undefined,
            this.toBigInt(node['hash']),
            node['description'] ?? undefined,
            this.toBigInt(node['estimatedCost']),
            this.toBigInt(node['actualCost']),
            node['resultCount'] ?? undefined,
            ImmutableList(pending.children.map(child => this.buildPlanNode(child)))
        )
    }

    /**
     * GraphQL `Long` arrives as a JSON string; a JSON number is accepted too (REST-style payloads).
     */
    private toBigInt(value: unknown): bigint | undefined {
        if (value == undefined) {
            return undefined
        }
        return BigInt(value as string | number)
    }

    /**
     * Parses an ISO-8601 date-time with offset (`2026-10-12T10:54:53.681095255Z`) keeping the nanosecond fraction,
     * which Luxon alone would round to milliseconds. An unparseable value is treated as not selected.
     */
    private parseStartedAt(value: unknown): OffsetDateTime | undefined {
        if (typeof value !== 'string') {
            return undefined
        }
        const match: RegExpMatchArray | null = value.match(/^([^.]+?)(?:\.(\d{1,9}))?(Z|[+-]\d{2}:\d{2})$/)
        if (match == null) {
            return undefined
        }
        const offset: string = match[3]!
        const wholeSeconds: DateTime = DateTime.fromISO(`${match[1]}${offset}`, { setZone: true })
        if (!wholeSeconds.isValid) {
            return undefined
        }
        const nanos: number = Number((match[2] ?? '').padEnd(9, '0'))
        return OffsetDateTime.of(BigInt(Math.floor(wholeSeconds.toSeconds())), nanos, offset)
    }
}
