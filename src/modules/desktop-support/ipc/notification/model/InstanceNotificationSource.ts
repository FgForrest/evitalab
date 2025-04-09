import { NotificationSourceDto } from '@/modules/desktop-support/ipc/notification/model/NotificationSourceDto'
import { ConnectionId } from '@/modules/connection/model/ConnectionId'

export const instanceNotificationSourceType = 'instance'

/**
 * Represents a notification from an instance (connection + driver).
 */
export class InstanceNotificationSource implements NotificationSourceDto {

    readonly type = instanceNotificationSourceType
    readonly connectionId: ConnectionId

    constructor(connectionId: ConnectionId) {
        this.connectionId = connectionId
    }
}
