import type { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import type { ConnectionId } from '@/modules/connection/model/ConnectionId'

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

export function isTabParamsDtoWithConnection(dto: TabParamsDto): dto is TabParamsDtoWithConnection {
    return 'connectionId' in dto && typeof (dto as TabParamsDtoWithConnection).connectionId === 'string'
}
