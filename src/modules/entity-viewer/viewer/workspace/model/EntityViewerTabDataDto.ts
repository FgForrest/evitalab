import type { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'
import { QueryLanguage } from '@/modules/entity-viewer/viewer/model/QueryLanguage'
import type { SelectedLayer } from '@/modules/entity-viewer/viewer/model/SelectedLayer.ts'

/**
 * Serializable DTO for storing {@link EntityViewerTabData} in a storage or link.
 */
export interface EntityViewerTabDataDto extends TabDataDto {
    readonly queryLanguage?: QueryLanguage
    readonly filterBy?: string
    readonly orderBy?: string
    readonly selectedLayers?: SelectedLayer[]
    readonly dataLocale?: string
    readonly displayedProperties?: string[]
    readonly pageSize?: number
    readonly pageNumber?: number
}
