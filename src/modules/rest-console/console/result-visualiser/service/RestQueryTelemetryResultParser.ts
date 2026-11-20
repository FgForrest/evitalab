import { List as ImmutableList } from 'immutable'
import { DateTime } from 'luxon'
import type { QueryTelemetryResultParser } from '@/modules/console/result-visualiser/service/QueryTelemetryResultParser'
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
import type { RestResultNode } from '@/modules/rest-console/console/result-visualiser/model/RestResultNode'

/**
 * Fields of a telemetry step the tree cannot be built without.
 */
const requiredStepFields: readonly string[] = ['operation', 'spentTime']

/**
 * {@link QueryTelemetryResultParser} for the REST API.
 *
 * REST returns the telemetry as the **nested** root step (`extraResults.queryTelemetry`, children in `steps[]`) and
 * each step's formula plan as a nested tree (`children[]`). The shape is fixed — there is no selection set — so
 * {@link ParsedQueryTelemetry.missingSelections} is always empty.
 *
 * `Long` values arrive as JSON numbers; the response must be parsed bigint-safely (see `parseRestResultJson`),
 * otherwise a plan `hash` above 2^53 is rounded and the winner rule of the visualiser compares wrong values.
 * Numbers and `bigint`s are both accepted here.
 */
export class RestQueryTelemetryResultParser implements QueryTelemetryResultParser {

    parse(queryResult: unknown): QueryTelemetryParseResult | undefined {
        const root: unknown = (queryResult as RestResultNode | undefined)?.['extraResults']?.['queryTelemetry']
        if (root == undefined || typeof root !== 'object' || Array.isArray(root)) {
            return undefined
        }
        const rootStep: RestResultNode = root as RestResultNode
        const missingRequired: string[] = requiredStepFields.filter(field => rootStep[field] == undefined)
        if (missingRequired.length > 0) {
            return new PartialQueryTelemetrySelection(ImmutableList(missingRequired))
        }
        return new ParsedQueryTelemetry(this.buildStep(rootStep, 0n))
    }

    /**
     * @param fallbackStart offset used when a step carries no `start`: the parent's start for the first child, the
     *        previous sibling's end for the following ones
     */
    private buildStep(node: RestResultNode, fallbackStart: bigint): QueryTelemetry {
        const start: bigint = this.toBigInt(node['start']) ?? fallbackStart
        const spentTime: bigint = this.toBigInt(node['spentTime']) ?? 0n

        const children: QueryTelemetry[] = []
        let nextStart: bigint = start
        for (const childNode of (node['steps'] as RestResultNode[] | null | undefined) ?? []) {
            const child: QueryTelemetry = this.buildStep(childNode, nextStart)
            children.push(child)
            nextStart = child.start + child.spentTime
        }

        return new QueryTelemetry(
            this.resolveOperation(node['operation']),
            start,
            spentTime,
            this.toBigInt(node['selfTime']),
            ImmutableList(((node['arguments'] as unknown[] | null | undefined) ?? []).map(it => String(it))),
            this.parseStartedAt(node['startedAt']),
            this.buildMetrics(node['metrics']),
            this.buildPlan(node['plan']),
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

    private buildMetrics(metrics: RestResultNode | null | undefined): QueryTelemetryMetrics | undefined {
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

    private buildPlan(plan: RestResultNode | null | undefined): FormulaPlan | undefined {
        if (plan == undefined || plan['id'] == undefined) {
            return undefined
        }
        return new FormulaPlan(
            Number(plan['id']),
            plan['refTo'] == undefined ? undefined : Number(plan['refTo']),
            this.toBigInt(plan['hash']),
            plan['description'] ?? undefined,
            this.toBigInt(plan['estimatedCost']),
            this.toBigInt(plan['actualCost']),
            plan['resultCount'] == undefined ? undefined : Number(plan['resultCount']),
            ImmutableList(((plan['children'] as RestResultNode[] | null | undefined) ?? [])
                .map(child => this.buildPlan(child))
                .filter((child): child is FormulaPlan => child != undefined))
        )
    }

    /**
     * Accepts a JSON number, a `bigint` (unsafe integers of the bigint-safe parse) and a numeric string (the type
     * the specification declares for some of the fields).
     */
    private toBigInt(value: unknown): bigint | undefined {
        if (value == undefined) {
            return undefined
        }
        if (typeof value === 'bigint') {
            return value
        }
        if (typeof value === 'number') {
            return BigInt(Math.trunc(value))
        }
        return BigInt(String(value))
    }

    /**
     * Parses an ISO-8601 date-time with offset (`2026-10-12T10:54:53.681095255Z`) keeping the nanosecond fraction,
     * which Luxon alone would round to milliseconds. An unparseable value is treated as missing.
     */
    private parseStartedAt(value: unknown): OffsetDateTime | undefined {
        if (typeof value !== 'string') {
            return undefined
        }
        const match: RegExpMatchArray | null = value.match(/^([^.]+?)(?:\.(\d{1,9}))?(Z|[+-]\d{2}:\d{2})$/)
        if (match == null) {
            return undefined
        }
        const offset: string = match[3] ?? 'Z'
        const wholeSeconds: DateTime = DateTime.fromISO(`${match[1]}${offset}`, { setZone: true })
        if (!wholeSeconds.isValid) {
            return undefined
        }
        const nanos: number = Number((match[2] ?? '').padEnd(9, '0'))
        return OffsetDateTime.of(BigInt(Math.floor(wholeSeconds.toSeconds())), nanos, offset)
    }
}
