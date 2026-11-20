import { describe, expect, test } from 'vitest'
import { ResultVisualiserState } from '@/modules/console/result-visualiser/model/ResultVisualiserState'
import type {
    QueryTelemetryVisualiserState
} from '@/modules/console/result-visualiser/model/query-telemetry/QueryTelemetryVisualiserState'
import { TelemetryTab, TelemetryTabKind } from '@/modules/console/result-visualiser/model/query-telemetry/TelemetryTab'

function openPlanTab(state: QueryTelemetryVisualiserState): void {
    const tab: TelemetryTab = new TelemetryTab(TelemetryTabKind.Plan, 'OVERALL')
    state.tabs.value = [...state.tabs.value, tab]
    state.activeTabKey.value = tab.key
}

describe('Result visualiser state', () => {
    test('Should keep telemetry tabs while bound to the same result', () => {
        const result: object = {}
        const state: ResultVisualiserState = new ResultVisualiserState()
        state.bindResult(result)
        openPlanTab(state.queryTelemetryState('query'))
        state.queryTelemetryState('query').hideNotComputed.value = true

        // the visualiser was remounted with the same result
        state.bindResult(result)
        const restored: QueryTelemetryVisualiserState = state.queryTelemetryState('query')

        expect(restored.tabs.value.map(it => it.key)).toEqual(['overview:', 'plan:OVERALL'])
        expect(restored.activeTabKey.value).toBe('plan:OVERALL')
        expect(restored.hideNotComputed.value).toBe(true)
    })

    test('Should reset telemetry tabs for a new result but keep the selection', () => {
        const state: ResultVisualiserState = new ResultVisualiserState()
        state.bindResult({})
        state.selectedQueryName.value = 'query'
        openPlanTab(state.queryTelemetryState('query'))

        state.bindResult({})

        expect(state.queryTelemetryState('query').tabs.value.map(it => it.key)).toEqual(['overview:'])
        expect(state.queryTelemetryState('query').activeTabKey.value).toBe('overview:')
        expect(state.selectedQueryName.value).toBe('query')
    })

    test('Should keep separate telemetry tabs per query', () => {
        const state: ResultVisualiserState = new ResultVisualiserState()
        state.bindResult({})
        openPlanTab(state.queryTelemetryState('first'))

        expect(state.queryTelemetryState('second').tabs.value).toHaveLength(1)
        expect(state.queryTelemetryState('first').tabs.value).toHaveLength(2)
    })
})
