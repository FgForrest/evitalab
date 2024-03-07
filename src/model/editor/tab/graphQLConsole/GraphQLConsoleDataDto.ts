import { TabRequestComponentDataDto } from '@/model/editor/tab/TabRequestComponentDataDto'

/**
 * Serializable DTO for storing {@link GraphQLConsoleData} in a storage or link.
 */
export interface GraphQLConsoleDataDto extends TabRequestComponentDataDto {
    readonly query?: string
    readonly variables?: string
}
