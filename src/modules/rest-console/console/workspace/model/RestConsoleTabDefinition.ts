import { DefineComponent, markRaw } from 'vue'
import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { RestConsoleTabParams } from '@/modules/rest-console/console/workspace/model/RestConsoleTabParams'
import { RestConsoleTabData } from '@/modules/rest-console/console/workspace/model/RestConsoleTabData'
import RestConsole from '@/modules/rest-console/console/component/RestConsole.vue'
import { TabType } from '@/modules/workspace/tab/model/TabType'

/**
 * Defines a GraphQL console tab.
 */
export class RestConsoleTabDefinition extends TabDefinition<RestConsoleTabParams, RestConsoleTabData> {

    constructor(title: string, params: RestConsoleTabParams, initialData: RestConsoleTabData) {
        super(
            undefined,
            title,
            'mdi-api',
            markRaw(RestConsole as DefineComponent<any, any, any>),
            params,
            initialData
        )
    }

    get type(): TabType {
        return TabType.RestConsole
    }
}

