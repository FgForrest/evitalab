import { DefineComponent, markRaw } from 'vue'
import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { VoidTabData } from '@/modules/workspace/tab/model/void/VoidTabData'
import { ErrorViewerTabParams } from '@/modules/error-viewer/viewer/workspace/model/ErrorViewerTabParams'
import ErrorViewer from '@/modules/error-viewer/viewer/component/ErrorViewer.vue'
import { TabType } from '@/modules/workspace/tab/model/TabType'

/**
 * Creates new error viewer tab.
 */
export class ErrorViewerTabDefinition extends TabDefinition<ErrorViewerTabParams, VoidTabData> {

    constructor(title: string, params: ErrorViewerTabParams) {
        super(
            undefined,
            title,
            'mdi-alert-circle',
            markRaw(ErrorViewer as DefineComponent<any, any, any>),
            params,
            new VoidTabData()
        )
    }

    get type(): TabType {
        return TabType.ErrorViewer
    }
}
