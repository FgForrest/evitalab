import { NotificationType } from '@/modules/notification/model/NotificationType'

/**
 * Payload of a single notification passed to the toaster for rendering.
 */
export type NotificationData = {
    readonly type: NotificationType,
    readonly message: string,
}
