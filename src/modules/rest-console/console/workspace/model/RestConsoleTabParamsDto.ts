import { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import { ConnectionId } from '@/modules/connection/model/ConnectionId'

/**
 * Serializable DTO for storing {@link RestConsoleTabParams} in a storage or link.
 */
export interface RestConsoleTabParamsDto extends TabParamsDto {
    readonly connectionId: ConnectionId
    readonly catalogName: string
}
