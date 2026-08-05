import type { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import type { ConnectionId } from '@/modules/connection/model/ConnectionId'

/**
 * DTO for tab params that use connection.
 */
export interface TabParamsDtoWithConnection extends TabParamsDto {
    /**
     * May be missing in payloads built by external applications, which cannot know the connection
     * ID of the target evitaLab instance. Such payloads are resolved against the single connection
     * the instance is running with.
     */
    connectionId?: ConnectionId
    /**
     * Used when connection cannot be resolved by ID (in some cases)
     */
    readonly connectionName?: string
}

export function isTabParamsDtoWithConnection(dto: unknown): dto is TabParamsDtoWithConnection {
    return dto != null && typeof dto === 'object' && typeof (dto as { connectionId?: unknown }).connectionId === 'string'
}
