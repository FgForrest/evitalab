import { RestInstanceType } from '@/modules/database-driver/connector/rest/model/RestInstanceType'
import type { TabParamsDtoWithConnection } from '@/modules/workspace/tab/model/TabParamsDtoWithConnection'

/**
 * Serializable DTO for storing {@link RestConsoleTabParams} in a storage or link.
 */
export interface RestConsoleTabParamsDto extends TabParamsDtoWithConnection {
    readonly catalogName: string
    readonly instanceType: RestInstanceType
}
