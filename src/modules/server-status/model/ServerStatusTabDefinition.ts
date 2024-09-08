import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { VoidTabData } from '@/modules/workspace/tab/model/void/VoidTabData'
import { ServerStatusTabParams } from './ServerStatusTabParams'
import { DefineComponent, markRaw } from 'vue'
import ServerStatus from '@/modules/server-status/component/ServerStatus.vue'
import { TabType } from '@/modules/workspace/tab/model/TabType'

// todo docs
export class ServerStatusTabDefinition extends TabDefinition<ServerStatusTabParams, VoidTabData> {
    constructor(params: ServerStatusTabParams) {
        super(
            undefined,
            'Server status',
            'mdi-database-outline',
            markRaw(ServerStatus as DefineComponent<any, any, any>),
            params,
            new VoidTabData()
        )
    }

    get type(): TabType {
        return TabType.ServerStatus
    }
}
