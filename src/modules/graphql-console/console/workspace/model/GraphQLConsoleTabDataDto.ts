import { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'

/**
 * Serializable DTO for storing {@link GraphQLConsoleData} in a storage or link.
 */
export interface GraphQLConsoleTabDataDto extends TabDataDto {
    readonly query?: string
    readonly variables?: string
}
