import { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'

/**
 * Serializable DTO for storing {@link RestConsoleTabData} in a storage or link.
 */
export interface RestConsoleTabDataDto extends TabDataDto {
    readonly entityType?: string
    readonly operation?: string
    readonly query?: string
}
