import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { VoidTabData } from '@/modules/workspace/tab/model/void/VoidTabData'
import type { DefineComponent } from 'vue'
import { markRaw } from 'vue'
import type { HistoryViewerTabParams } from '@/modules/history-viewer/model/HistoryViewerTabParams.ts'
import HistoryViewer from '@/modules/history-viewer/component/HistoryViewer.vue'

export class HistoryViewerTabDefinition extends TabDefinition<HistoryViewerTabParams, VoidTabData> {
    constructor(title: string, params: HistoryViewerTabParams) {
        super(
            undefined,
            title,
            HistoryViewerTabDefinition.icon(),
            markRaw(HistoryViewer as DefineComponent<any, any, any>),
            params,
            new VoidTabData()
        )
    }

    static icon(): string {
        return 'mdi-chart-gantt'
    }
}
