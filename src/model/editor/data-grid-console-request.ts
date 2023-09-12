import { TabRequest } from '@/model/editor/editor'
import { EvitaDBConnection } from '@/model/lab'
import { DefineComponent, markRaw } from 'vue'
import LabEditorConsoleDataGrid from '@/components/lab/editor/console/LabEditorConsoleDataGrid.vue'
import { DataGridConsoleProps, DataGridDataPointer } from '@/model/editor/data-grid-console'

export class DataGridConsoleRequest extends TabRequest<DataGridConsoleProps> {
    constructor(connection: EvitaDBConnection, catalogName: string, entityType: string) {
        super(
            `${catalogName} - ${entityType} [${connection.name}]`,
            'mdi-table',
            markRaw(LabEditorConsoleDataGrid as DefineComponent<any, any, any>),
            {
                dataPointer: new DataGridDataPointer(connection, catalogName, entityType)
            }
        )
    }
}
