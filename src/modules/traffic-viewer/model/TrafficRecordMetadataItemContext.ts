import { Toaster } from '@/modules/notification/service/Toaster'
import { Ref } from 'vue'
import { TrafficRecordHistoryCriteria } from '@/modules/traffic-viewer/model/TrafficRecordHistoryCriteria'

/**
 * Defines context for interacting with metadata items from UI
 */
export class TrafficRecordMetadataItemContext {

    readonly toaster: Toaster
    readonly historyCriteria: Ref<TrafficRecordHistoryCriteria>

    constructor(toaster: Toaster, historyCriteria: Ref<TrafficRecordHistoryCriteria>) {
        this.toaster = toaster
        this.historyCriteria = historyCriteria
    }
}
