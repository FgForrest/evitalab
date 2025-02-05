import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { TrafficRecordingsViewerTabParams } from '@/modules/traffic-viewer/model/TrafficRecordingsViewerTabParams'
import { VoidTabData } from '@/modules/workspace/tab/model/void/VoidTabData'
import { DefineComponent, markRaw } from 'vue'
import TrafficRecordingsViewer from '@/modules/traffic-viewer/components/TrafficRecordingsViewer.vue'

export class TrafficRecordingsViewerTabDefinition extends TabDefinition<TrafficRecordingsViewerTabParams, VoidTabData> {

    constructor(title: string, params: TrafficRecordingsViewerTabParams) {
        super(
            undefined,
            title,
            TrafficRecordingsViewerTabDefinition.icon(),
            markRaw(TrafficRecordingsViewer as DefineComponent<any, any, any>),
            params,
            new VoidTabData()
        )
    }

    static icon(): string {
        return 'mdi-record-circle-outline'
    }
}
