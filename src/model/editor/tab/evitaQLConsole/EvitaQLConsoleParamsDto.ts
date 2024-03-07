import { EvitaDBConnectionId } from '@/model/lab'
import { TabRequestComponentParamsDto } from '@/model/editor/tab/TabRequestComponentParamsDto'

/**
 * Serializable DTO for storing {@link EvitaQLConsoleParams} in a storage or link.
 */
export interface EvitaQLConsoleParamsDto extends TabRequestComponentParamsDto {
    readonly connectionId: EvitaDBConnectionId
    readonly catalogName: string
}
