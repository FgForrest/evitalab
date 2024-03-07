import { TabRequestComponentDataDto } from '@/model/editor/tab/TabRequestComponentDataDto'

/**
 * Serializable DTO for storing {@link EvitaQLConsoleDataDto} in a storage or link.
 */
export interface EvitaQLConsoleDataDto extends TabRequestComponentDataDto {
    readonly query?: string
    readonly variables?: string
}
