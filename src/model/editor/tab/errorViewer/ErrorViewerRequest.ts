import { DefineComponent, markRaw } from 'vue'
import LabEditorErrorViewer from '@/components/lab/editor/error-viewer/LabEditorErrorViewer.vue'
import { EvitaDBConnection, LabError } from '@/model/lab'
import { TabRequest } from '@/model/editor/tab/TabRequest'
import { ErrorViewerParams } from '@/model/editor/tab/errorViewer/ErrorViewerParams'
import { VoidTabRequestComponentData } from '@/model/editor/tab/void/VoidTabRequestComponentData'

/**
 * Creates new error viewer tab.
 */
export class ErrorViewerRequest extends TabRequest<ErrorViewerParams, VoidTabRequestComponentData> {
    private constructor(title: string, params: ErrorViewerParams) {
        super(
            undefined,
            title,
            'mdi-alert-circle',
            markRaw(LabEditorErrorViewer as DefineComponent<any, any, any>),
            params,
            new VoidTabRequestComponentData()
        )
    }

    static createNew(connection: EvitaDBConnection | undefined, error: LabError): ErrorViewerRequest {
        return new ErrorViewerRequest(this.constructTitle(connection, error), new ErrorViewerParams(error))
    }

    private static constructTitle(connection: EvitaDBConnection | undefined, error: LabError): string {
        return error.message + (connection != undefined ? ` [${connection.name}]` : '')
    }
}
