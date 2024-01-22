import {
    TabRequest,
    TabRequestComponentParamsDto,
    VoidTabRequestComponentData
} from '@/model/editor/editor'
import { SchemaPointer, SchemaViewerDataPointer, SchemaViewerParams } from '@/model/editor/schema-viewer'
import { EvitaDBConnection } from '@/model/lab'
import { DefineComponent, markRaw } from 'vue'
import LabEditorSchemaViewer from '@/components/lab/editor/schema-viewer/LabEditorSchemaViewer.vue'
import { LabService } from '@/services/lab.service'

/**
 * Creates new schema viewer tab.
 */
export class SchemaViewerRequest extends TabRequest<SchemaViewerParams, VoidTabRequestComponentData> {

    private constructor(title: string, params: SchemaViewerParams, initialData: VoidTabRequestComponentData | undefined = undefined) {
        super(
            title,
            'mdi-file-code',
            markRaw(LabEditorSchemaViewer as DefineComponent<any, any, any>),
            params,
            initialData
        )
    }

    static createNew(connection: EvitaDBConnection,
                     schemaPointer: SchemaPointer): SchemaViewerRequest {
        return new SchemaViewerRequest(
            this.constructTitle(connection, schemaPointer),
            new SchemaViewerParams(
                new SchemaViewerDataPointer(connection, schemaPointer)
            )
        )
    }

    static restoreFromJson(labService: LabService, paramsJson: TabRequestComponentParamsDto): SchemaViewerRequest {
        const params: SchemaViewerParams = SchemaViewerParams.restoreFromSerializable(labService, paramsJson)

        return new SchemaViewerRequest(
            this.constructTitle(params.dataPointer.connection, params.dataPointer.schemaPointer),
            params
        )
    }

    private static constructTitle(connection: EvitaDBConnection, schemaPointer: SchemaPointer): string {
        return `${schemaPointer.path().slice(-1)[0]} [${connection.name}]`
    }
}
