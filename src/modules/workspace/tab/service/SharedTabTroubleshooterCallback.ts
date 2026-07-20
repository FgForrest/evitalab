import type { ConnectionId } from '@/modules/connection/model/ConnectionId'
import type { AnyTabDefinition } from '@/modules/workspace/tab/model/TabDefinition'

export interface SharedTabTroubleshooterCallback {
    (newConnectionId: ConnectionId): Promise<AnyTabDefinition>
}
