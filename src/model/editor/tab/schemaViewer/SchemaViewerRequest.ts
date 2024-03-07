import { EvitaDBConnection } from '@/model/lab'
import { DefineComponent, markRaw } from 'vue'
import LabEditorSchemaViewer from '@/components/lab/editor/schema-viewer/LabEditorSchemaViewer.vue'
import { LabService } from '@/services/lab.service'
import { TabRequest } from '@/model/editor/tab/TabRequest'
import { SchemaViewerParams } from '@/model/editor/tab/schemaViewer/SchemaViewerParams'
import { VoidTabRequestComponentData } from '@/model/editor/tab/void/VoidTabRequestComponentData'
import { SchemaPointer } from '@/model/editor/tab/schemaViewer/SchemaPointer'
import { SchemaViewerDataPointer } from '@/model/editor/tab/schemaViewer/SchemaViewerDataPointer'
import { TabRequestComponentParamsDto } from '@/model/editor/tab/TabRequestComponentParamsDto'

/**
 * Creates new schema viewer tab.
 */
export class SchemaViewerRequest extends TabRequest<SchemaViewerParams, VoidTabRequestComponentData> {

    private constructor(title: string, params: SchemaViewerParams) {
        super(
            undefined,
            title,
            'mdi-file-code',
            markRaw(LabEditorSchemaViewer as DefineComponent<any, any, any>),
            params,
            new VoidTabRequestComponentData()
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
