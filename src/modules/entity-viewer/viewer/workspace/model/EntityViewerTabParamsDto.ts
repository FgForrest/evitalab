import { TabParamsDtoWithConnection } from '@/modules/workspace/tab/model/TabParamsDtoWithConnection'

/**
 * Serializable DTO for storing {@link EntityViewerTabParams} in a storage or link.
 */
export interface EntityViewerTabParamsDto extends TabParamsDtoWithConnection {
    readonly catalogName: string
    readonly entityType: string
}
