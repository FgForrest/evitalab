import { NotificationDefinitionDto } from '@/modules/desktop-support/ipc/notification/model/NotificationDefinitionDto'
import { NotificationId } from '@/modules/desktop-support/ipc/notification/model/NotificationId'

/**
 * Interface of notification manager IPC for driver
 */
export interface LabNotificationManagerIpc {
    addNotification(definition: NotificationDefinitionDto): Promise<NotificationId>,
    requestNotificationClosure(id: NotificationId): void,

    onNotificationClicked(listener: (id: NotificationId) => void): void,
    onNotificationClosed(listener: (id: NotificationId) => void): void
}
