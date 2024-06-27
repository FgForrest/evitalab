import { TabRequest, TabRequestComponentDataDto, TabRequestComponentParamsDto } from '@/model/editor/editor'
import { SchemaDiffViewerParams } from '@/model/editor/tab/schema-diff-viewer/schema-diff-viewer-params'
import { SchemaDiffViewerData } from '@/model/editor/tab/schema-diff-viewer/schema-diff-viewer-data'
import { DefineComponent, markRaw } from 'vue'
import LabEditorSchemaDiffViewer from '@/components/lab/editor/schema-diff-viewer/LabEditorSchemaDiffViewer.vue'
import { EvitaDBConnection } from '@/model/lab'
import { SchemaDiffDataPointer } from '@/model/editor/tab/schema-diff-viewer/schema-diff-data-pointer'
import { LabService } from '@/services/lab.service'

// todo
export class SchemaDiffViewerRequest extends TabRequest<SchemaDiffViewerParams, SchemaDiffViewerData> {

    private constructor(title: string, params: SchemaDiffViewerParams, initialData: SchemaDiffViewerData | undefined = undefined) {
        super(
            title,
            'mdi-compare-horizontal',
            markRaw(LabEditorSchemaDiffViewer as DefineComponent<any, any, any>),
            params,
            initialData
        )
    }

    static createNew(connection: EvitaDBConnection,
                     catalogName: string,
                     initialData: SchemaDiffViewerData | undefined = undefined,
                     executeOnOpen: boolean = false): SchemaDiffViewerRequest {
        return new SchemaDiffViewerRequest(
            this.constructTitle(connection, catalogName),
            new SchemaDiffViewerParams(
                new SchemaDiffDataPointer(
                    connection,
                    catalogName,
                ),
                executeOnOpen
            ),
            initialData
        )
    }

    static restoreFromJson(labService: LabService, paramsJson: TabRequestComponentParamsDto, dataJson: TabRequestComponentDataDto): SchemaDiffViewerRequest {
        const params: SchemaDiffViewerParams = SchemaDiffViewerParams.restoreFromSerializable(labService, paramsJson)
        const data: SchemaDiffViewerData = SchemaDiffViewerData.restoreFromSerializable(labService, dataJson)

        return new SchemaDiffViewerRequest(
            this.constructTitle(params.dataPointer.connection, params.dataPointer.catalogName),
            params,
            data
        )
    }

    private static constructTitle(connection: EvitaDBConnection, catalogName: string): string {
        return `${catalogName} [${connection.name}]`
    }
}
