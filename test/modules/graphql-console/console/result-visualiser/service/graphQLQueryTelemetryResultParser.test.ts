import { describe, expect, test } from 'vitest'
import {
    GraphQLQueryTelemetryResultParser
} from '@/modules/graphql-console/console/result-visualiser/service/GraphQLQueryTelemetryResultParser'
import {
    ParsedQueryTelemetry,
    PartialQueryTelemetrySelection,
    type QueryTelemetryParseResult
} from '@/modules/console/result-visualiser/model/query-telemetry/QueryTelemetryParseResult'
import { QueryPhase } from '@/modules/database-driver/request-response/data/QueryPhase'
import type { QueryTelemetry } from '@/modules/database-driver/request-response/data/QueryTelemetry'
import type { FormulaPlan } from '@/modules/database-driver/request-response/data/FormulaPlan'
import q3 from './fixture/query-telemetry-q3.json'
import q4 from './fixture/query-telemetry-q4.json'
import r3 from './fixture/query-telemetry-r3.json'
import q6 from './fixture/query-telemetry-q6.json'

/**
 * GraphQL sends the telemetry as a flat pre-order list with `level`, and each plan as a flat list with `level` /
 * `childrenCount`. The fixtures are real evitaDB payloads (stripped to the telemetry) whose selection sets differ:
 * q3/q4/q6 select everything, r3 omits `start`, `startedAt`, `plan.hash` and most metrics.
 */

const parser: GraphQLQueryTelemetryResultParser = new GraphQLQueryTelemetryResultParser()

function queryResultOf(fixture: { data: { queryProduct: unknown } }): unknown {
    return fixture.data.queryProduct
}

function parseComplete(fixture: { data: { queryProduct: unknown } }): ParsedQueryTelemetry {
    const result: QueryTelemetryParseResult | undefined = parser.parse(queryResultOf(fixture))
    expect(result).toBeInstanceOf(ParsedQueryTelemetry)
    return result as ParsedQueryTelemetry
}

function flatten(step: QueryTelemetry): QueryTelemetry[] {
    return [step, ...step.steps.toArray().flatMap(flatten)]
}

function planNodes(plan: FormulaPlan): FormulaPlan[] {
    return [plan, ...plan.children.toArray().flatMap(planNodes)]
}

function planDepth(plan: FormulaPlan): number {
    return 1 + Math.max(0, ...plan.children.toArray().map(planDepth))
}

function stepsOf(step: QueryTelemetry): QueryPhase[] {
    return step.steps.toArray().map(it => it.operation)
}

describe('GraphQL query telemetry result parser', () => {
    test('Should return nothing when the result has no telemetry', () => {
        expect(parser.parse({ extraResults: { hierarchy: {} } })).toBeUndefined()
        expect(parser.parse({ recordPage: {} })).toBeUndefined()
        expect(parser.parse({ extraResults: { queryTelemetry: [] } })).toBeUndefined()
    })

    test('Should rebuild the step tree from levels (q3, nested query alternative without plan)', () => {
        const { telemetry, missingSelections } = parseComplete(q3)

        expect(missingSelections.toArray()).toEqual([])
        expect(telemetry.operation).toBe(QueryPhase.Overall)
        expect(flatten(telemetry)).toHaveLength(16)
        expect(stepsOf(telemetry)).toEqual([QueryPhase.Planning, QueryPhase.Execution])

        const planning: QueryTelemetry = telemetry.steps.get(0)!
        expect(stepsOf(planning)).toEqual([
            QueryPhase.PlanningIndexUsage,
            QueryPhase.PlanningFilter,
            QueryPhase.PlanningSort,
            QueryPhase.PlanningExtraResultFabrication
        ])

        const nestedQuery: QueryTelemetry = planning.steps.get(0)!.steps.get(0)!
        expect(nestedQuery.operation).toBe(QueryPhase.PlanningNestedQuery)
        expect(nestedQuery.arguments.get(0)).toContain('filtering reference `brand`')
        const nestedAlternative: QueryTelemetry = nestedQuery.steps.get(1)!.steps.get(0)!
        expect(nestedAlternative.operation).toBe(QueryPhase.PlanningFilterAlternative)
        expect(nestedAlternative.plan).toBeUndefined()

        const mainAlternatives: QueryTelemetry[] = planning.steps.get(1)!.steps.toArray()
        expect(mainAlternatives.map(it => it.plan?.children.size)).toEqual([2, 2])
        expect(mainAlternatives[1]!.plan!.hash).toBe(-5201375408823747239n)
        expect(mainAlternatives[1]!.plan!.hash).toBe(telemetry.plan!.hash)
    })

    test('Should convert int64 strings to bigint and read root metrics and startedAt (q4)', () => {
        const { telemetry } = parseComplete(q4)

        expect(telemetry.start).toBe(0n)
        expect(telemetry.spentTime).toBe(46034987n)
        expect(telemetry.selfTime).toBe(106882n)
        expect(telemetry.metrics!.estimatedCardinality).toBe(2314n)
        expect(telemetry.metrics!.actualCardinality).toBe(2222n)
        expect(telemetry.metrics!.actualCost).toBe(10832038n)
        expect(telemetry.metrics!.ioFetchCount).toBe(0n)
        expect(telemetry.metrics!.prefetched).toBe(false)
        expect(telemetry.startedAt!.offset).toBe('Z')
        expect(telemetry.startedAt!.timestamp.nanos).toBe(947774602)
        expect(telemetry.startedAt!.timestamp.seconds).toBe(BigInt(Date.parse('2026-10-12T10:54:53Z') / 1000))

        const nonRoot: QueryTelemetry[] = flatten(telemetry).slice(1)
        expect(nonRoot.every(it => it.metrics == undefined && it.startedAt == undefined)).toBe(true)
    })

    test('Should keep planning nested inside execution and attach all three plans (q4)', () => {
        const { telemetry } = parseComplete(q4)

        const all: QueryTelemetry[] = flatten(telemetry)
        expect(all).toHaveLength(22)
        expect(all.filter(it => it.plan != undefined).map(it => planNodes(it.plan!).length)).toEqual([26, 26, 17])

        const hierarchyProducer: QueryTelemetry = telemetry.steps.get(1)!.steps.get(2)!.steps.get(3)!
        expect(hierarchyProducer.arguments.toArray()).toEqual(['HierarchyStatisticsProducer'])
        expect(stepsOf(hierarchyProducer)).toEqual([
            QueryPhase.PlanningFilterNestedQuery,
            QueryPhase.ExecutionFilterNestedQuery
        ])
        const nestedAlternative: QueryTelemetry = hierarchyProducer.steps.get(0)!.steps.get(1)!.steps.get(0)!
        expect(nestedAlternative.operation).toBe(QueryPhase.PlanningFilterAlternative)
        expect(nestedAlternative.plan!.hash).toBe(-5103564197961774239n)
        expect(nestedAlternative.plan!.estimatedCost).toBe(10749591n)

        const ineligible: QueryTelemetry = telemetry.steps.get(0)!.steps.get(1)!.steps.get(1)!
        expect(ineligible.plan).toBeUndefined()
        expect(ineligible.arguments.get(0)).toContain('HIGH_CARDINALITY')
    })

    test('Should mark not computed plan nodes as absent rather than zero (q4 candidate plan)', () => {
        const { telemetry } = parseComplete(q4)

        const executed: FormulaPlan[] = planNodes(telemetry.plan!)
        expect(executed[0]!.actualCost).toBe(10832038n)
        expect(executed[0]!.resultCount).toBe(2222)

        const candidate: FormulaPlan = telemetry.steps.get(0)!.steps.get(1)!.steps.get(0)!.plan!
        expect(planNodes(candidate).every(it => it.actualCost == undefined && it.resultCount == undefined)).toBe(true)
        expect(planNodes(candidate).map(it => it.id)).toEqual(executed.map(it => it.id))
    })

    test('Should reconstruct start sequentially and report the missing optional selections (r3)', () => {
        const { telemetry, missingSelections } = parseComplete(r3)

        expect(missingSelections.toArray()).toEqual([
            'start',
            'startedAt',
            'metrics.estimatedCost',
            'metrics.actualCost',
            'metrics.recordsReturned',
            'metrics.ioFetchCount',
            'metrics.ioFetchedSizeBytes',
            'plan.hash'
        ])
        expect(telemetry.startedAt).toBeUndefined()
        expect(telemetry.metrics!.actualCardinality).toBe(18n)
        expect(telemetry.metrics!.estimatedCost).toBeUndefined()

        expect(flatten(telemetry).map(it => [it.operation, it.start])).toEqual([
            [QueryPhase.Overall, 0n],
            [QueryPhase.Planning, 0n],
            [QueryPhase.PlanningIndexUsage, 0n],
            [QueryPhase.PlanningFilter, 162079n],
            [QueryPhase.PlanningFilterAlternative, 162079n],
            [QueryPhase.PlanningSort, 7157855n],
            [QueryPhase.PlanningExtraResultFabrication, 7212285n],
            [QueryPhase.Execution, 7327680n],
            [QueryPhase.ExecutionFilter, 7327680n],
            [QueryPhase.ExecutionSortAndSlice, 17100647n]
        ])
    })

    test('Should keep refTo back-references as childless nodes without hash (r3)', () => {
        const { telemetry } = parseComplete(r3)

        const nodes: FormulaPlan[] = planNodes(telemetry.plan!)
        expect(nodes).toHaveLength(77)
        expect(planDepth(telemetry.plan!)).toBe(11)
        expect(nodes.every(it => it.hash == undefined)).toBe(true)

        const references: FormulaPlan[] = nodes.filter(it => it.refTo != undefined)
        expect(references).toHaveLength(3)
        for (const reference of references) {
            expect(reference.children.isEmpty()).toBe(true)
            expect(reference.description).toBeUndefined()
            expect(reference.refTo).toBe(reference.id)
            expect(nodes.some(it => it.id === reference.refTo && it.refTo == undefined)).toBe(true)
        }
    })

    test('Should parse an empty result with a one-node plan (q6)', () => {
        const { telemetry } = parseComplete(q6)

        expect(flatten(telemetry)).toHaveLength(10)
        expect(telemetry.plan!.description).toBe('EMPTY')
        expect(telemetry.plan!.estimatedCost).toBe(0n)
        expect(telemetry.plan!.children.isEmpty()).toBe(true)
        expect(telemetry.metrics!.recordsReturned).toBe(0n)
    })

    test('Should rebuild the plan from childrenCount when level was not selected', () => {
        const steps = structuredClone(q4.data.queryProduct.extraResults.queryTelemetry) as Record<string, unknown>[]
        for (const step of steps) {
            for (const planNode of (step['plan'] as Record<string, unknown>[] | null) ?? []) {
                delete planNode['level']
            }
        }

        const byLevel: ParsedQueryTelemetry = parseComplete(q4)
        const byChildrenCount: ParsedQueryTelemetry = parseComplete({
            data: { queryProduct: { extraResults: { queryTelemetry: steps } } }
        })

        expect(byChildrenCount.missingSelections.toArray()).toEqual([])
        expect(planNodes(byChildrenCount.telemetry.plan!).map(it => [it.id, it.children.size]))
            .toEqual(planNodes(byLevel.telemetry.plan!).map(it => [it.id, it.children.size]))
    })

    test('Should drop the plan and report it when neither level nor childrenCount was selected', () => {
        const steps = structuredClone(q6.data.queryProduct.extraResults.queryTelemetry) as Record<string, unknown>[]
        for (const step of steps) {
            for (const planNode of (step['plan'] as Record<string, unknown>[] | null) ?? []) {
                delete planNode['level']
                delete planNode['childrenCount']
            }
        }

        const { telemetry, missingSelections } = parseComplete({
            data: { queryProduct: { extraResults: { queryTelemetry: steps } } }
        })

        expect(missingSelections.toArray()).toEqual(['plan.level'])
        expect(flatten(telemetry).every(it => it.plan == undefined)).toBe(true)
    })

    test('Should report a partial selection when required fields are missing', () => {
        const result = parser.parse({
            extraResults: {
                queryTelemetry: [
                    { operation: 'OVERALL', selfTime: '10' },
                    { operation: 'PLANNING', selfTime: '5' }
                ]
            }
        })

        expect(result).toBeInstanceOf(PartialQueryTelemetrySelection)
        expect((result as PartialQueryTelemetrySelection).missingRequiredSelections.toArray())
            .toEqual(['level', 'spentTime'])
    })

    test('Should tolerate a lone root with only the required fields selected', () => {
        const { telemetry, missingSelections } = parseComplete({
            data: {
                queryProduct: {
                    extraResults: { queryTelemetry: [{ level: 1, operation: 'OVERALL', spentTime: '1500' }] }
                }
            }
        })

        expect(missingSelections.toArray()).toEqual(['start', 'selfTime', 'arguments', 'startedAt', 'metrics', 'plan'])
        expect(telemetry.start).toBe(0n)
        expect(telemetry.spentTime).toBe(1500n)
        expect(telemetry.selfTime).toBeUndefined()
        expect(telemetry.arguments.isEmpty()).toBe(true)
        expect(telemetry.steps.isEmpty()).toBe(true)
    })

    test('Should fail on an operation unknown to this evitaLab', () => {
        expect(() => parser.parse({
            extraResults: { queryTelemetry: [{ level: 1, operation: 'TIME_TRAVEL', spentTime: '1' }] }
        })).toThrow(/TIME_TRAVEL/)
    })
})
