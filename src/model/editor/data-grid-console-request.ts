import { TabRequest } from '@/model/editor/editor'
import { EvitaDBConnection } from '@/model/lab'
import { DefineComponent, markRaw } from 'vue'
import LabEditorConsoleDataGrid from '@/components/lab/editor/console/LabEditorConsoleDataGrid.vue'
import { DataGridConsoleData, DataGridConsoleParams, DataGridDataPointer } from '@/model/editor/data-grid-console'

/**
 * Creates new data grid tab.
 */
export class DataGridConsoleRequest extends TabRequest<DataGridConsoleParams, DataGridConsoleData> {

    constructor(connection: EvitaDBConnection,
                catalogName: string,
                entityType: string,
                initialData: DataGridConsoleData | undefined = undefined,
                executeOnOpen: boolean = false) {
        super(
            `${catalogName} - ${entityType} [${connection.name}]`,
            'mdi-table',
            markRaw(LabEditorConsoleDataGrid as DefineComponent<any, any, any>),
            {
                dataPointer: new DataGridDataPointer(connection, catalogName, entityType),
                executeOnOpen
            },
            initialData
        )
    }
}
