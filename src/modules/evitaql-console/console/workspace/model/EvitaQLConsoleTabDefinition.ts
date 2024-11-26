import EvitaQLConsole from '@/modules/evitaql-console/console/component/EvitaQLConsole.vue'
import { DefineComponent, markRaw } from 'vue'
import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { EvitaQLConsoleTabParams } from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabParams'
import { EvitaQLConsoleTabData } from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabData'

/**
 * Creates new EvitaQL tab.
 */
export class EvitaQLConsoleTabDefinition extends TabDefinition<EvitaQLConsoleTabParams, EvitaQLConsoleTabData> {

    constructor(title: string, params: EvitaQLConsoleTabParams, initialData: EvitaQLConsoleTabData) {
        super(
            undefined,
            title,
            EvitaQLConsoleTabDefinition.icon(),
            markRaw(EvitaQLConsole as DefineComponent<any, any, any>),
            params,
            initialData
        )
    }

    static icon(): string {
        return 'mdi-variable'
    }
}

