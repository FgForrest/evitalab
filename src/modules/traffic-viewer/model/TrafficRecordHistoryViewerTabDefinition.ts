import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { TrafficRecordHistoryViewerTabParams } from '@/modules/traffic-viewer/model/TrafficRecordHistoryViewerTabParams'
import { TrafficRecordHistoryViewerTabData } from '@/modules/traffic-viewer/model/TrafficRecordHistoryViewerTabData'
import { DefineComponent, markRaw } from 'vue'
import TrafficRecordHistoryViewer from '@/modules/traffic-viewer/components/TrafficRecordHistoryViewer.vue'

export class TrafficRecordHistoryViewerTabDefinition extends TabDefinition<TrafficRecordHistoryViewerTabParams, TrafficRecordHistoryViewerTabData> {

    constructor(title: string,
                params: TrafficRecordHistoryViewerTabParams,
                data: TrafficRecordHistoryViewerTabData) {
        super(
            undefined,
            title,
            TrafficRecordHistoryViewerTabDefinition.icon(),
            markRaw(TrafficRecordHistoryViewer as DefineComponent<any, any, any>),
            params,
            data,
        )
    }

    static icon(): string {
        return 'mdi-record-circle-outline'
    }
}
