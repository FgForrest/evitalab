import RestConsole from '@/modules/rest-console/console/component/RestConsole.vue'
import { markRaw } from 'vue'
import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import { RestConsoleTabParams } from '@/modules/rest-console/console/workspace/model/RestConsoleTabParams'
import { RestConsoleTabData } from '@/modules/rest-console/console/workspace/model/RestConsoleTabData'

/**
 * Defines a REST console tab.
 */
export class RestConsoleTabDefinition extends TabDefinition<RestConsoleTabParams, RestConsoleTabData> {

    constructor(title: string, params: RestConsoleTabParams, initialData: RestConsoleTabData) {
        super(
            undefined,
            title,
            RestConsoleTabDefinition.icon(),
            markRaw(RestConsole as Component),
            params,
            initialData
        )
    }

    get tabType(): TabType {
        return TabType.RestConsole
    }

    static icon(): string {
        return 'mdi-api'
    }
}
