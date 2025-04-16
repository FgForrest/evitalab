import { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import { ConnectionId } from '@/modules/connection/model/ConnectionId'

/**
 * DTO for tab params that use connection.
 */
export interface TabParamsDtoWithConnection extends TabParamsDto {
    connectionId: ConnectionId
    /**
     * Used when connection cannot be resolved by ID (in some cases)
     */
    readonly connectionName: string | undefined
}

export function isTabParamsDtoWithConnection(dto: any): dto is TabParamsDtoWithConnection {
    return typeof dto.connectionId === 'string'
}
