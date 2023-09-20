import { TabRequest } from '@/model/editor/editor'
import { EvitaDBConnection } from '@/model/lab'
import { DefineComponent, markRaw } from 'vue'
import LabEditorDataGrid from '@/components/lab/editor/data-grid/LabEditorDataGrid.vue'
import { DataGridConsoleData, DataGridConsoleParams, DataGridDataPointer } from '@/model/editor/data-grid'

/**
 * Creates new data grid tab.
 */
export class DataGridRequest extends TabRequest<DataGridConsoleParams, DataGridConsoleData> {

    constructor(connection: EvitaDBConnection,
                catalogName: string,
                entityType: string,
                initialData: DataGridConsoleData | undefined = undefined,
                executeOnOpen: boolean = false) {
        super(
            `${catalogName} - ${entityType} [${connection.name}]`,
            'mdi-table',
            markRaw(LabEditorDataGrid as DefineComponent<any, any, any>),
            {
                dataPointer: new DataGridDataPointer(connection, catalogName, entityType),
                executeOnOpen
            },
            initialData
        )
    }
}
