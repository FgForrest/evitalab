import type { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'
import { QueryLanguage } from '@/modules/entity-viewer/viewer/model/QueryLanguage'
import type { SelectedScope } from '@/modules/entity-viewer/viewer/model/SelectedScope.ts'

/**
 * Serializable DTO for storing {@link EntityViewerTabData} in a storage or link.
 */
export interface EntityViewerTabDataDto extends TabDataDto {
    readonly queryLanguage?: QueryLanguage
    readonly filterBy?: string
    readonly orderBy?: string
    readonly selectedLayers?: SelectedScope[]
    readonly dataLocale?: string
    readonly displayedProperties?: string[]
    readonly pageSize?: number
    readonly pageNumber?: number
    /**
     * Grid sort state (column keys and directions). Language-agnostic counterpart of {@link orderBy}, which is
     * regenerated from it in whatever query language is currently selected.
     */
    readonly sortBy?: { key: string, order?: 'asc' | 'desc' }[]
    /**
     * When `true`, {@link orderBy} is text written by the user and the grid must never overwrite it.
     */
    readonly orderByDefinedManually?: boolean
}
