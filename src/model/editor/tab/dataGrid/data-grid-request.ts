import { EvitaDBConnection } from '@/model/lab'
import { DefineComponent, markRaw } from 'vue'
import LabEditorDataGrid from '@/components/lab/editor/data-grid/LabEditorDataGrid.vue'
import { LabService } from '@/services/lab.service'
import { TabRequest } from '@/model/editor/tab/TabRequest'
import { DataGridData, DataGridDataPointer, DataGridParams } from '@/model/editor/tab/dataGrid/data-grid'
import { TabRequestComponentParamsDto } from '@/model/editor/tab/TabRequestComponentParamsDto'
import { TabRequestComponentDataDto } from '@/model/editor/tab/TabRequestComponentDataDto'

/**
 * Creates new data grid tab.
 */
export class DataGridRequest extends TabRequest<DataGridParams, DataGridData> {

    private constructor(title: string, params: DataGridParams, initialData: DataGridData) {
        super(
            undefined,
            title,
            'mdi-table',
            markRaw(LabEditorDataGrid as DefineComponent<any, any, any>),
            params,
            initialData
        )
    }

    static createNew(connection: EvitaDBConnection,
                     catalogName: string,
                     entityType: string,
                     initialData: DataGridData | undefined = undefined,
                     executeOnOpen: boolean = false): DataGridRequest {
        return new DataGridRequest(
            this.constructTitle(connection, catalogName, entityType),
            new DataGridParams(
                new DataGridDataPointer(connection, catalogName, entityType),
                executeOnOpen
            ),
            initialData ? initialData : new DataGridData()
        )
    }

    static restoreFromJson(labService: LabService, paramsJson: TabRequestComponentParamsDto, dataJson?: TabRequestComponentDataDto): DataGridRequest {
        const params: DataGridParams = DataGridParams.restoreFromSerializable(labService, paramsJson)
        const data: DataGridData = dataJson == undefined ? new DataGridData() : DataGridData.restoreFromSerializable(dataJson)

        return new DataGridRequest(
            this.constructTitle(params.dataPointer.connection, params.dataPointer.catalogName, params.dataPointer.entityType),
            params,
            data
        )
    }

    private static constructTitle(connection: EvitaDBConnection, catalogName: string, entityType: string): string {
        return `${catalogName} - ${entityType} [${connection.name}]`
    }
}
