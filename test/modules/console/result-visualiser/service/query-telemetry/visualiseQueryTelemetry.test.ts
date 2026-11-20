import { describe, expect, test } from 'vitest'
import { List } from 'immutable'
import {
    visualiseQueryTelemetry
} from '@/modules/console/result-visualiser/service/query-telemetry/visualiseQueryTelemetry'
import { ParsedQueryTelemetry } from '@/modules/console/result-visualiser/model/query-telemetry/QueryTelemetryParseResult'
import type {
    VisualisedQueryTelemetry
} from '@/modules/console/result-visualiser/model/query-telemetry/VisualisedQueryTelemetry'
import type {
    VisualisedTelemetryStep
} from '@/modules/console/result-visualiser/model/query-telemetry/VisualisedTelemetryStep'
import { TelemetryPhaseGroup } from '@/modules/console/result-visualiser/model/query-telemetry/TelemetryPhaseGroup'
import { telemetryStepLabel } from '@/modules/console/result-visualiser/service/query-telemetry/telemetryStepLabel'
import { QueryPhase } from '@/modules/database-driver/request-response/data/QueryPhase'
import { formula, parsedQ3, parsedQ4, parsedQ6, parsedR3, step } from './fixtures'

function alternatives(telemetry: VisualisedQueryTelemetry): VisualisedTelemetryStep[] {
    return telemetry.steps.filter(it => it.operation === QueryPhase.PlanningFilterAlternative).toArray()
}

function shareOf(telemetry: VisualisedQueryTelemetry, group: TelemetryPhaseGroup): number {
    return telemetry.phaseShares.find(it => it.group === group)?.nanos ?? -1
}

describe('Query telemetry view model', () => {
    test('Should index every step under a stable operation path', () => {
        const telemetry: VisualisedQueryTelemetry = visualiseQueryTelemetry(parsedQ3)

        expect(telemetry.root.id).toBe('OVERALL')
        expect(telemetry.steps.size).toBe(16)
        expect(telemetry.steps.first()).toBe(telemetry.root)
        expect(new Set(telemetry.steps.map(it => it.id)).size).toBe(telemetry.steps.size)
        const sort: VisualisedTelemetryStep | undefined = telemetry.getStep('OVERALL/EXECUTION[1]/EXECUTION_SORT_AND_SLICE[1]')
        expect(sort?.sortResolution).toBe('ARRAY_MERGE_WALKx1')
        expect(telemetry.pathTo(sort?.id ?? '').map(it => it.label).toArray()).toEqual(['OVERALL', 'EXECUTION', 'SORT_AND_SLICE'])
        expect(telemetry.subtreeSize(telemetry.root)).toBe(16)
        expect(telemetry.maxDepth).toBe(5)

        // the same payload yields the same ids
        expect(visualiseQueryTelemetry(parsedQ3).steps.map(it => it.id).toArray())
            .toEqual(telemetry.steps.map(it => it.id).toArray())
    })

    test('Should convert durations to numbers and compute shares', () => {
        const telemetry: VisualisedQueryTelemetry = visualiseQueryTelemetry(parsedQ3)
        const execution: VisualisedTelemetryStep | undefined = telemetry.getStep('OVERALL/EXECUTION[1]')

        expect(telemetry.total).toBe(3481506)
        expect(telemetry.root.shareOfTotal).toBe(1)
        expect(telemetry.root.shareOfParent).toBe(1)
        expect(execution?.start).toBe(3076317)
        expect(execution?.spent).toBe(404467)
        expect(execution?.self).toBe(100207)
        expect(execution?.group).toBe(TelemetryPhaseGroup.Execution)
        expect(execution?.shareOfTotal).toBeCloseTo(404467 / 3481506)
        expect(execution?.children.get(1)?.shareOfParent).toBeCloseTo(244013 / 404467)
        expect(telemetry.startedAt).toBeDefined()
        expect(telemetry.hasPlan).toBe(true)
    })

    test('Should mark the winner by the executed plan root hash and the ineligible candidate (q4)', () => {
        const telemetry: VisualisedQueryTelemetry = visualiseQueryTelemetry(parsedQ4)
        const [winner, ineligible, nested] = alternatives(telemetry)

        expect(winner?.alternative?.winner).toBe(true)
        expect(winner?.alternative?.eligible).toBe(true)
        expect(winner?.planStepId).toBe('OVERALL')
        expect(winner?.alternativeOrdinal).toBe(1)
        expect(telemetryStepLabel(winner!)).toBe('ALTERNATIVE #1')

        expect(ineligible?.alternative?.eligible).toBe(false)
        expect(ineligible?.alternative?.ineligibleReason).toBe('HIGH_CARDINALITY')
        expect(ineligible?.alternative?.winner).toBe(false)
        expect(ineligible?.alternative?.outranked).toBe(true)
        expect(ineligible?.alternative?.planNotRecorded).toBe(false)
        expect(ineligible?.planStepId).toBeUndefined()

        // nested hierarchy-statistics selection: its plan is not part of the executed main plan
        expect(nested?.depth).toBe(6)
        expect(nested?.alternative?.winner).toBe(false)
        expect(nested?.planStepId).toBe(nested?.id)
    })

    test('Should keep the loser\'s own plan and flag a nested alternative without plan (q3)', () => {
        const telemetry: VisualisedQueryTelemetry = visualiseQueryTelemetry(parsedQ3)
        const [nestedWithoutPlan, loser, winner] = alternatives(telemetry)

        expect(nestedWithoutPlan?.alternative?.eligible).toBe(true)
        expect(nestedWithoutPlan?.alternative?.planNotRecorded).toBe(true)
        expect(nestedWithoutPlan?.planStepId).toBeUndefined()

        expect(loser?.alternative?.winner).toBe(false)
        expect(loser?.alternative?.outranked).toBe(true)
        expect(loser?.planStepId).toBe(loser?.id)
        expect(winner?.alternative?.winner).toBe(true)
        expect(winner?.planStepId).toBe('OVERALL')
        expect(telemetry.root.planStepId).toBe('OVERALL')
    })

    test('Should leave the winner unknown when the plan hash was not selected (r3)', () => {
        const telemetry: VisualisedQueryTelemetry = visualiseQueryTelemetry(parsedR3)
        const [alternative] = alternatives(telemetry)

        expect(alternative?.alternative?.winner).toBe(false)
        expect(alternative?.alternative?.hashUnknown).toBe(true)
        expect(alternative?.alternative?.outranked).toBe(false)
        expect(alternative?.planStepId).toBe(alternative?.id)
        expect(telemetry.missingSelections.toArray()).toContain('plan.hash')
        expect(telemetry.startedAt).toBeUndefined()
    })

    test('Should match top-level alternatives by the executed plan root hash only', () => {
        const executedPlan = formula(0, 'AND', [formula(1, 'ATTRIBUTE', [], { hash: 200n })], { hash: 100n })
        const winner = step(QueryPhase.PlanningFilterAlternative, 2, 2, [], ['Index type: GLOBAL'], formula(10, 'AND', [], { hash: 100n }))
        const loser = step(QueryPhase.PlanningFilterAlternative, 4, 2, [], ['Index type: REFERENCED'], formula(20, 'ATTRIBUTE', [], { hash: 200n }))
        const nestedAlternative = step(QueryPhase.PlanningFilterAlternative, 52, 2, [], ['Index type: GLOBAL'], formula(30, 'ATTRIBUTE', [], { hash: 200n }))
        const nestedFilter = step(QueryPhase.PlanningFilter, 51, 4, [nestedAlternative])
        const nestedPlanning = step(QueryPhase.PlanningNestedQuery, 50, 6, [nestedFilter])
        const root = step(QueryPhase.Overall, 0, 100, [
            step(QueryPhase.Planning, 0, 10, [step(QueryPhase.PlanningFilter, 1, 8, [winner, loser])]),
            step(QueryPhase.Execution, 20, 80, [nestedPlanning])
        ], [], executedPlan)
        const telemetry: VisualisedQueryTelemetry = visualiseQueryTelemetry(new ParsedQueryTelemetry(root))
        const [visualisedWinner, visualisedLoser, visualisedNested] = alternatives(telemetry)

        expect(visualisedWinner?.alternative?.winner).toBe(true)
        // the loser's root equals a sub-formula of the executed plan, which must not make it a winner
        expect(visualisedLoser?.alternative?.winner).toBe(false)
        expect(visualisedLoser?.alternative?.outranked).toBe(true)
        expect(visualisedLoser?.planStepId).toBe(visualisedLoser?.id)
        // a nested selection still wins when its root is found inside the executed plan
        expect(visualisedNested?.alternative?.winner).toBe(true)
    })

    test('Should flag no missing plan in a profile taken without PLAN', () => {
        const nestedAlternative = step(QueryPhase.PlanningFilterAlternative, 52, 2, [], ['Index type: GLOBAL'])
        const nestedFilter = step(QueryPhase.PlanningFilter, 51, 4, [nestedAlternative])
        const root = step(QueryPhase.Overall, 0, 100, [
            step(QueryPhase.Planning, 0, 10, [step(QueryPhase.PlanningFilter, 1, 8, [
                step(QueryPhase.PlanningFilterAlternative, 2, 2, [], ['Index type: GLOBAL'])
            ])]),
            step(QueryPhase.Execution, 20, 80, [step(QueryPhase.PlanningNestedQuery, 50, 6, [nestedFilter])])
        ])
        const telemetry: VisualisedQueryTelemetry = visualiseQueryTelemetry(new ParsedQueryTelemetry(root))

        expect(telemetry.hasPlan).toBe(false)
        alternatives(telemetry).forEach(alternative => {
            expect(alternative.alternative?.eligible).toBe(true)
            expect(alternative.alternative?.planNotRecorded).toBe(false)
            expect(alternative.planStepId).toBeUndefined()
        })
    })

    test('Should flag only a nested alternative without plan in a profile taken with PLAN', () => {
        const executedPlan = formula(0, 'AND', [], { hash: 100n })
        const topLevelWithPlan = step(QueryPhase.PlanningFilterAlternative, 2, 2, [], ['Index type: GLOBAL'], formula(10, 'AND', [], { hash: 100n }))
        const topLevelWithoutPlan = step(QueryPhase.PlanningFilterAlternative, 4, 2, [], ['Index type: REFERENCED'])
        const nestedWithoutPlan = step(QueryPhase.PlanningFilterAlternative, 52, 2, [], ['Index type: GLOBAL'])
        const nestedFilter = step(QueryPhase.PlanningFilter, 51, 4, [nestedWithoutPlan])
        const root = step(QueryPhase.Overall, 0, 100, [
            step(QueryPhase.Planning, 0, 10, [step(QueryPhase.PlanningFilter, 1, 8, [topLevelWithPlan, topLevelWithoutPlan])]),
            step(QueryPhase.Execution, 20, 80, [step(QueryPhase.PlanningNestedQuery, 50, 6, [nestedFilter])])
        ], [], executedPlan)
        const telemetry: VisualisedQueryTelemetry = visualiseQueryTelemetry(new ParsedQueryTelemetry(root))
        const [visualisedWithPlan, visualisedWithoutPlan, visualisedNested] = alternatives(telemetry)

        // top-level eligible alternative with a plan: enabled plan button
        expect(visualisedWithPlan?.alternative?.planNotRecorded).toBe(false)
        expect(visualisedWithPlan?.planStepId).toBe('OVERALL')
        // top-level alternative without a plan: no plan button at all
        expect(visualisedWithoutPlan?.alternative?.planNotRecorded).toBe(false)
        expect(visualisedWithoutPlan?.planStepId).toBeUndefined()
        // nested eligible alternative without a plan: disabled plan button
        expect(visualisedNested?.alternative?.planNotRecorded).toBe(true)
        expect(visualisedNested?.planStepId).toBeUndefined()
    })

    test('Should split the phase share bar from specific nodes, not by prefix', () => {
        const fetching = step(QueryPhase.Fetching, 700, 200, [step(QueryPhase.FetchingReferences, 710, 50)])
        const nestedPlanning = step(QueryPhase.PlanningFilterNestedQuery, 420, 30)
        const fabrication = step(QueryPhase.ExtraResultsFabrication, 400, 100, [nestedPlanning])
        const execution = step(QueryPhase.Execution, 350, 600, [fabrication, fetching])
        const planning = step(QueryPhase.Planning, 10, 300)
        const root = step(QueryPhase.Overall, 0, 1000, [planning, execution])
        const telemetry: VisualisedQueryTelemetry = visualiseQueryTelemetry(new ParsedQueryTelemetry(root))

        expect(shareOf(telemetry, TelemetryPhaseGroup.Planning)).toBe(300)
        expect(shareOf(telemetry, TelemetryPhaseGroup.Execution)).toBe(400)
        expect(shareOf(telemetry, TelemetryPhaseGroup.Fetching)).toBe(200)
        expect(shareOf(telemetry, TelemetryPhaseGroup.Root)).toBe(100)
        expect(telemetry.phaseShares.reduce((sum, it) => sum + it.share, 0)).toBeCloseTo(1)
        expect(telemetry.hasPlan).toBe(false)
    })

    test('Should label reference fetching by its reference name', () => {
        const references = step(QueryPhase.FetchingReferences, 10, 5, [], ['Reference name: `brand`'])
        const root = step(QueryPhase.Overall, 0, 100, [step(QueryPhase.Execution, 0, 50, [
            step(QueryPhase.Fetching, 5, 40, [step(QueryPhase.FetchingReferenceBodies, 6, 30, [references])])
        ])])
        const telemetry: VisualisedQueryTelemetry = visualiseQueryTelemetry(new ParsedQueryTelemetry(root))
        const visualised: VisualisedTelemetryStep | undefined = telemetry.steps.last()

        expect(visualised?.referenceName).toBe('brand')
        expect(visualised?.label).toBe('brand')
        expect(visualised?.conciseArgument).toBe('`brand`')
        expect(visualised?.group).toBe(TelemetryPhaseGroup.Fetching)
    })

    test('Should tolerate a lone root without steps', () => {
        const root = step(QueryPhase.Overall, 0, 1000)
        const telemetry: VisualisedQueryTelemetry = visualiseQueryTelemetry(new ParsedQueryTelemetry(root, List(['metrics'])))

        expect(telemetry.steps.size).toBe(1)
        expect(telemetry.maxDepth).toBe(0)
        expect(shareOf(telemetry, TelemetryPhaseGroup.Root)).toBe(1000)
        expect(telemetry.missingSelections.toArray()).toEqual(['metrics'])
    })

    test('Should not divide by a zero total', () => {
        const root = step(QueryPhase.Overall, 0, 0, [], [], formula(0, 'EMPTY'))
        const telemetry: VisualisedQueryTelemetry = visualiseQueryTelemetry(new ParsedQueryTelemetry(root))

        expect(telemetry.root.shareOfTotal).toBe(0)
        expect(telemetry.phaseShares.every(it => it.share === 0)).toBe(true)
        expect(telemetry.hasPlan).toBe(true)
    })

    test('Should handle an empty result with a single-node plan (q6)', () => {
        const telemetry: VisualisedQueryTelemetry = visualiseQueryTelemetry(parsedQ6)

        expect(telemetry.root.plan?.children.size).toBe(0)
        expect(alternatives(telemetry)[0]?.alternative?.winner).toBe(true)
    })
})
