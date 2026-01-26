import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import type { DefineComponent } from 'vue'
import { markRaw } from 'vue'
import type { MutationHistoryViewerTabParams } from '@/modules/history-viewer/model/MutationHistoryViewerTabParams.ts'
import MutationHistoryViewer from '@/modules/history-viewer/component/MutationHistoryViewer.vue'
import type { MutationHistoryViewerTabData } from '@/modules/history-viewer/model/MutationHistoryViewerTabData.ts'

export class MutationHistoryViewerTabDefinition extends TabDefinition<MutationHistoryViewerTabParams, MutationHistoryViewerTabData> {
    constructor(title: string,
                params: MutationHistoryViewerTabParams,
                data: MutationHistoryViewerTabData
    ) {
        super(
            undefined,
            title,
            MutationHistoryViewerTabDefinition.icon(),
            markRaw(MutationHistoryViewer as DefineComponent<any, any, any>),
            params,
            data
        )
    }

    static icon(): string {
        return 'mdi-chart-gantt'
    }
}
