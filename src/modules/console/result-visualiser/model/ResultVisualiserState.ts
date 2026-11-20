import { type Ref, ref } from 'vue'
import type { VisualiserTypeType } from './VisualiserTypeType'
import { QueryTelemetryVisualiserState } from './query-telemetry/QueryTelemetryVisualiserState'

/**
 * View state of the result visualiser owned by the console that renders it, so that it lives as long as the console
 * tab and survives remounting the visualiser (switching between the raw and the visualised result). Not persisted.
 *
 * The selected query and visualiser type are kept as they are; the per-query states of the visualisers belong to one
 * result and are dropped when the visualiser is bound to a different one.
 */
export class ResultVisualiserState {
    readonly selectedQueryName: Ref<string | undefined> = ref()
    readonly selectedVisualiserType: Ref<VisualiserTypeType | undefined> = ref()

    private boundResult: unknown = undefined
    private readonly queryTelemetryStates: Map<string, QueryTelemetryVisualiserState> = new Map()

    /**
     * Binds the state to the visualised result; a result other than the bound one (compared by identity) drops the
     * states of the previous result.
     */
    bindResult(result: unknown): void {
        if (result === this.boundResult) {
            return
        }
        this.boundResult = result
        this.queryTelemetryStates.clear()
    }

    /**
     * State of the query telemetry visualiser of the query of the bound result, created on first access.
     */
    queryTelemetryState(queryName: string): QueryTelemetryVisualiserState {
        let state: QueryTelemetryVisualiserState | undefined = this.queryTelemetryStates.get(queryName)
        if (state == undefined) {
            state = new QueryTelemetryVisualiserState()
            this.queryTelemetryStates.set(queryName, state)
        }
        return state
    }
}
