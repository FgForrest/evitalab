import { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import { ConnectionId } from '@/modules/connection/model/ConnectionId'

/**
 * Serializable DTO for storing {@link EvitaQLConsoleTabParams} in a storage or link.
 */
export interface EvitaQLConsoleTabParamsDto extends TabParamsDto {
    readonly connectionId: ConnectionId
    readonly catalogName: string
}
