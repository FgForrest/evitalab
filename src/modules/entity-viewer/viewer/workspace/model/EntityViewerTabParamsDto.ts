import { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import { ConnectionId } from '@/modules/connection/model/ConnectionId'

/**
 * Serializable DTO for storing {@link EntityViewerTabParams} in a storage or link.
 */
export interface EntityViewerTabParamsDto extends TabParamsDto {
    readonly connectionId: ConnectionId
    readonly catalogName: string
    readonly entityType: string
}
