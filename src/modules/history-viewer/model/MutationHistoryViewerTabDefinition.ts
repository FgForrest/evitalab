import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { VoidTabData } from '@/modules/workspace/tab/model/void/VoidTabData'
import type { DefineComponent } from 'vue'
import { markRaw } from 'vue'
import type { MutationHistoryViewerTabParams } from '@/modules/history-viewer/model/MutationHistoryViewerTabParams.ts'
import MutationHistoryViewer from '@/modules/history-viewer/component/MutationHistoryViewer.vue'

export class MutationHistoryViewerTabDefinition extends TabDefinition<MutationHistoryViewerTabParams, VoidTabData> {
    constructor(title: string, params: MutationHistoryViewerTabParams) {
        super(
            undefined,
            title,
            MutationHistoryViewerTabDefinition.icon(),
            markRaw(MutationHistoryViewer as DefineComponent<any, any, any>),
            params,
            new VoidTabData()
        )
    }

    static icon(): string {
        return 'mdi-chart-gantt'
    }
}
