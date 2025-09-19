import type { Toaster } from '@/modules/notification/service/Toaster'
import type { Ref } from 'vue'
import type { MutationHistoryCriteria } from '@/modules/history-viewer/model/MutationHistoryCriteria.ts'

/**
 * Defines context for interacting with metadata items from UI
 */
export class MutationHistoryMetadataItemContext {

    readonly toaster: Toaster
    readonly historyCriteria: Ref<MutationHistoryCriteria>

    constructor(toaster: Toaster, historyCriteria: Ref<MutationHistoryCriteria>) {
        this.toaster = toaster
        this.historyCriteria = historyCriteria
    }
}
