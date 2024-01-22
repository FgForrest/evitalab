import { TabRequest, VoidTabRequestComponentData } from '@/model/editor/editor'
import { ErrorViewerParams } from '@/model/editor/error-viewer'
import { DefineComponent, markRaw } from 'vue'
import LabEditorErrorViewer from '@/components/lab/editor/error-viewer/LabEditorErrorViewer.vue'
import { EvitaDBConnection, LabError } from '@/model/lab'

/**
 * Creates new error viewer tab.
 */
export class ErrorViewerRequest extends TabRequest<ErrorViewerParams, VoidTabRequestComponentData> {
    constructor(connection: EvitaDBConnection | undefined, error: LabError) {
        super(

            error.message + (connection ? ` [${connection.name}]` : ''),
            'mdi-alert-circle',
            markRaw(LabEditorErrorViewer as DefineComponent<any, any, any>),
            {
                error
            }
        )
    }
}
