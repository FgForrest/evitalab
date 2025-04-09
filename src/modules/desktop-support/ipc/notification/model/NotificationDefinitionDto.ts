import { NotificationSeverity } from '@/modules/desktop-support/ipc/notification/model/NotificationSeverity'
import { NotificationSourceDto } from '@/modules/desktop-support/ipc/notification/model/NotificationSourceDto'

/**
 * IPC DTO for NotificationDefinition
 */
export interface NotificationDefinitionDto {
    readonly severity: NotificationSeverity
    readonly source: NotificationSourceDto
    readonly message: string
}
