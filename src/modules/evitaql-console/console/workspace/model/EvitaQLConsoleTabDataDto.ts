import { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'

/**
 * Serializable DTO for storing {@link EvitaQLConsoleTabDataDto} in a storage or link.
 */
export interface EvitaQLConsoleTabDataDto extends TabDataDto {
    readonly query?: string
    readonly variables?: string
}
