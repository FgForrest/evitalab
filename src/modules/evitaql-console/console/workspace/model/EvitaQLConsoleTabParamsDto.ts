import { TabParamsDtoWithConnection } from '@/modules/workspace/tab/model/TabParamsDtoWithConnection'

/**
 * Serializable DTO for storing {@link EvitaQLConsoleTabParams} in a storage or link.
 */
export interface EvitaQLConsoleTabParamsDto extends TabParamsDtoWithConnection {
    readonly catalogName: string
}
