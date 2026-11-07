import type { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'
import { QueryLanguage } from '@/modules/entity-viewer/viewer/model/QueryLanguage'
import type { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope'

/**
 * Serializable DTO for storing {@link EntityViewerTabData} in a storage or link.
 */
export interface EntityViewerTabDataDto extends TabDataDto {
    readonly queryLanguage?: QueryLanguage
    readonly filterBy?: string
    readonly orderBy?: string
    readonly selectedScopes?: { scope: EntityScope, selected: boolean }[]
    /**
     * @deprecated legacy key written by evitaLab builds before the scope rename, read only when
     * {@link selectedScopes} is absent so that older persisted tabs and share links keep their scope selection
     */
    readonly selectedLayers?: { scope: EntityScope, value: boolean }[]
    readonly dataLocale?: string
    readonly selectedProperties?: string[]
    /**
     * @deprecated legacy key written by evitaLab builds before the rename to {@link selectedProperties}, read only
     * when {@link selectedProperties} is absent so that older persisted tabs and share links keep their columns
     */
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
