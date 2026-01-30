import type { ConnectionId } from '@/modules/connection/model/ConnectionId'
import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import type { TabParams } from '@/modules/workspace/tab/model/TabParams'
import type { TabData } from '@/modules/workspace/tab/model/TabData'

export interface SharedTabTroubleshooterCallback {
    (newConnectionId: ConnectionId): Promise<TabDefinition<TabParams<unknown>, TabData<unknown>>>
}
