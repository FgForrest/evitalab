import { DefineComponent, markRaw } from 'vue'
import SchemaViewer from '@/modules/schema-viewer/viewer/component/SchemaViewer.vue'
import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { SchemaViewerTabParams } from '@/modules/schema-viewer/viewer/workspace/model/SchemaViewerTabParams'
import { VoidTabData } from '@/modules/workspace/tab/model/void/VoidTabData'

/**
 * Creates new schema viewer tab.
 */
export class SchemaViewerTabDefinition extends TabDefinition<SchemaViewerTabParams, VoidTabData> {

    constructor(title: string, params: SchemaViewerTabParams) {
        super(
            undefined,
            title,
            'mdi-file-code',
            markRaw(SchemaViewer as DefineComponent<any, any, any>),
            params,
            new VoidTabData()
        )
    }
}
