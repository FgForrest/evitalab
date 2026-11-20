import type { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'
import type { RestParameterValues } from '@/modules/rest-console/console/model/RestParameterValue'

/**
 * Serializable DTO for storing {@link RestConsoleTabData} in a storage or link.
 */
export interface RestConsoleTabDataDto extends TabDataDto {
    readonly operationId?: string
    readonly method?: string
    readonly pathTemplate?: string
    readonly locale?: string
    readonly parameters?: RestParameterValues
    readonly body?: string
}
