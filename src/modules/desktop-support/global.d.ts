/**
 * Register desktop-driver APIs for Typescript
 */

import { LabNotificationManagerIpc } from '@/modules/desktop-support/ipc/notification/service/LabNotificationManagerIpc'

export {}

declare global {
    interface Window {
        labNotificationManager: LabNotificationManagerIpc
    }
}
