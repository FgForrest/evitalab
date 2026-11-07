import type { TabData } from '@/modules/workspace/tab/model/TabData'
import type { EntityViewerTabDataDto } from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabDataDto'
import { QueryLanguage } from '@/modules/entity-viewer/viewer/model/QueryLanguage'
import { QueryPriceMode } from '@/modules/entity-viewer/viewer/model/QueryPriceMode'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import type { SelectableScope } from '@/modules/entity-viewer/viewer/model/SelectableScope'

/**
 * Represents injectable/storable user data of the LabEditorConsoleDataGrid component.
 */
export class EntityViewerTabData implements TabData<EntityViewerTabDataDto> {
    readonly queryLanguage?: QueryLanguage
    readonly filterBy?: string
    readonly orderBy?: string
    readonly selectedScopes?: SelectableScope[]
    readonly dataLocale?: string
    readonly priceType?: QueryPriceMode
    readonly selectedProperties?: EntityPropertyKey[]
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

    constructor(queryLanguage?: QueryLanguage,
                filterBy?: string,
                orderBy?: string,
                dataLocale?: string,
                selectedProperties?: EntityPropertyKey[],
                pageSize?: number,
                pageNumber?: number,
                selectedScopes?: SelectableScope[],
                sortBy?: { key: string, order?: 'asc' | 'desc' }[],
                orderByDefinedManually?: boolean) {
        this.queryLanguage = queryLanguage
        this.filterBy = filterBy
        this.orderBy = orderBy
        this.dataLocale = dataLocale
        this.selectedProperties = selectedProperties
        this.pageSize = pageSize
        this.pageNumber = pageNumber
        this.selectedScopes = selectedScopes
        this.sortBy = sortBy
        this.orderByDefinedManually = orderByDefinedManually
    }

    toSerializable(): EntityViewerTabDataDto {
        return {
            queryLanguage: this.queryLanguage,
            filterBy: this.filterBy,
            orderBy: this.orderBy,
            selectedScopes: this.selectedScopes?.map(it => ({ scope: it.scope, selected: it.selected })),
            dataLocale: this.dataLocale,
            selectedProperties: this.selectedProperties?.map(key => key.toString()),
            pageSize: this.pageSize,
            pageNumber: this.pageNumber,
            sortBy: this.sortBy,
            orderByDefinedManually: this.orderByDefinedManually
        }
    }
}
