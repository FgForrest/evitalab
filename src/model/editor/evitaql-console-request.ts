import { TabRequest } from '@/model/editor/editor'
import { EvitaDBConnection } from '@/model/lab'
import { DefineComponent, markRaw } from 'vue'
import LabEditorConsoleEvitaQL from '@/components/lab/editor/console/LabEditorConsoleEvitaQL.vue'
import { EvitaQLConsoleProps, EvitaQLDataPointer } from '@/model/editor/evitaql-console'

/**
 * Creates new EvitaQL tab.
 */
export class EvitaQLConsoleRequest extends TabRequest<EvitaQLConsoleProps> {
    constructor(connection: EvitaDBConnection, catalogName: string) {
        super(
            `${catalogName} [${connection.name}]`,
            'mdi-console',
            markRaw(LabEditorConsoleEvitaQL as DefineComponent<any, any, any>),
            {
                dataPointer: new EvitaQLDataPointer(connection, catalogName)
            }
        )
    }
}

