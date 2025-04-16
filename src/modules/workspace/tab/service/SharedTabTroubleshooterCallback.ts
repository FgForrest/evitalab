import { ConnectionId } from '@/modules/connection/model/ConnectionId'
import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'

export interface SharedTabTroubleshooterCallback {
    (newConnectionId: ConnectionId): Promise<TabDefinition<any, any>>
}
