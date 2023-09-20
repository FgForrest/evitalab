import { TabRequest } from '@/model/editor/editor'
import { EvitaDBConnection } from '@/model/lab'
import { DefineComponent, markRaw } from 'vue'
import LabEditorEvitaQLConsole from '@/components/lab/editor/evitaql-console/LabEditorEvitaQLConsole.vue'
import { EvitaQLConsoleData, EvitaQLConsoleParams, EvitaQLDataPointer } from '@/model/editor/evitaql-console'

/**
 * Creates new EvitaQL tab.
 */
export class EvitaQLConsoleRequest extends TabRequest<EvitaQLConsoleParams, EvitaQLConsoleData> {

    constructor(connection: EvitaDBConnection,
                catalogName: string,
                initialData: EvitaQLConsoleData | undefined = undefined,
                executeOnOpen: boolean = false) {
        super(
            `${catalogName} [${connection.name}]`,
            'mdi-console',
            markRaw(LabEditorEvitaQLConsole as DefineComponent<any, any, any>),
            {
                dataPointer: new EvitaQLDataPointer(connection, catalogName),
                executeOnOpen
            },
            initialData
        )
    }
}

