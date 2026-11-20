import { type Ref, ref, shallowRef } from 'vue'
import { TelemetryTab } from './TelemetryTab'

/**
 * View state of the query telemetry visualiser of one query result: the open tabs, the active one and the Plan tab
 * filter. Kept outside the component (see `ResultVisualiserState`), so that it survives remounting the visualiser.
 */
export class QueryTelemetryVisualiserState {
    readonly tabs: Ref<TelemetryTab[]> = shallowRef([TelemetryTab.overview()])
    readonly activeTabKey: Ref<string> = ref(TelemetryTab.overview().key)
    /**
     * Whether Plan tabs leave out formulas that were not computed.
     */
    readonly hideNotComputed: Ref<boolean> = ref(false)
}
