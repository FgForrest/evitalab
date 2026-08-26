import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import { VoidTabData } from '@/modules/workspace/tab/model/void/VoidTabData'
import { ServerViewerTabParams } from './ServerViewerTabParams'
import { markRaw } from 'vue'
import type {  } from 'vue'
import ServerViewer from '@/modules/server-viewer/component/ServerViewer.vue'

export class ServerViewerTabDefinition extends TabDefinition<ServerViewerTabParams, VoidTabData> {
    constructor(title: string, params: ServerViewerTabParams) {
        super(
            undefined,
            title,
            ServerViewerTabDefinition.icon(),
            markRaw(ServerViewer as Component),
            params,
            new VoidTabData()
        )
    }

    get tabType(): TabType {
        return TabType.ServerViewer
    }

    static icon(): string {
        return 'mdi-database-outline'
    }
}
