import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import { TrafficRecordingsViewerTabParams } from '@/modules/traffic-viewer/model/TrafficRecordingsViewerTabParams'
import { VoidTabData } from '@/modules/workspace/tab/model/void/VoidTabData'
import { markRaw } from 'vue'
import type {  } from 'vue'
import TrafficRecordingsViewer from '@/modules/traffic-viewer/components/TrafficRecordingsViewer.vue'

export class TrafficRecordingsViewerTabDefinition extends TabDefinition<TrafficRecordingsViewerTabParams, VoidTabData> {

    constructor(title: string, params: TrafficRecordingsViewerTabParams) {
        super(
            undefined,
            title,
            TrafficRecordingsViewerTabDefinition.icon(),
            markRaw(TrafficRecordingsViewer as Component),
            params,
            new VoidTabData()
        )
    }

    get tabType(): TabType {
        return TabType.TrafficRecordingsViewer
    }

    static icon(): string {
        return 'mdi-record-circle-outline'
    }
}
