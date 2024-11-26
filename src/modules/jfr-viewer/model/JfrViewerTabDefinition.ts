import { TabDefinition } from "@/modules/workspace/tab/model/TabDefinition";
import { VoidTabData } from '@/modules/workspace/tab/model/void/VoidTabData'
import { JfrViewerTabParams } from '@/modules/jfr-viewer/model/JfrViewerTabParams'
import { DefineComponent, markRaw } from 'vue'
import JfrViewer from '@/modules/jfr-viewer/components/JfrViewer.vue'

export class JfrViewerTabDefinition extends TabDefinition<JfrViewerTabParams, VoidTabData>{
    constructor(title: string, params: JfrViewerTabParams) {
        super(
            undefined,
            title,
            JfrViewerTabDefinition.icon(),
            markRaw(JfrViewer as DefineComponent<any, any, any>),
            params,
            new VoidTabData()
        )
    }

    static icon(): string {
        return 'mdi-record-circle-outline'
    }
}
