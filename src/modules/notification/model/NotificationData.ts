import { NotificationType } from '@/modules/notification/model/NotificationType'

// todo docs
export type NotificationData = {
    readonly type: NotificationType,
    readonly message: string,
}
