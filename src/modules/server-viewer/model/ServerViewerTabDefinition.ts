import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { VoidTabData } from '@/modules/workspace/tab/model/void/VoidTabData'
import { ServerViewerTabParams } from './ServerViewerTabParams'
import { DefineComponent, markRaw } from 'vue'
import ServerViewer from '@/modules/server-viewer/component/ServerViewer.vue'

export class ServerViewerTabDefinition extends TabDefinition<ServerViewerTabParams, VoidTabData> {
    constructor(title: string, params: ServerViewerTabParams) {
        super(
            undefined,
            title,
            ServerViewerTabDefinition.icon(),
            markRaw(ServerViewer as DefineComponent<any, any, any>),
            params,
            new VoidTabData()
        )
    }

    static icon(): string {
        return 'mdi-database-outline'
    }
}
