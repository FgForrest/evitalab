import { TabData } from '@/modules/workspace/tab/model/TabData'
import { EntityViewerTabDataDto } from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabDataDto'
import { QueryLanguage } from '@/modules/entity-viewer/viewer/model/QueryLanguage'
import { QueryPriceMode } from '@/modules/entity-viewer/viewer/model/QueryPriceMode'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'

/**
 * Represents injectable/storable user data of the LabEditorConsoleDataGrid component.
 */
export class EntityViewerTabData implements TabData<EntityViewerTabDataDto> {
    readonly queryLanguage?: QueryLanguage
    readonly filterBy?: string
    readonly orderBy?: string
    readonly dataLocale?: string
    readonly priceType?: QueryPriceMode
    readonly displayedProperties?: EntityPropertyKey[]
    readonly pageSize?: number
    readonly pageNumber?: number

    constructor(queryLanguage?: QueryLanguage,
                filterBy?: string,
                orderBy?: string,
                dataLocale?: string,
                displayedProperties?: EntityPropertyKey[],
                pageSize?: number,
                pageNumber?: number) {
        this.queryLanguage = queryLanguage
        this.filterBy = filterBy
        this.orderBy = orderBy
        this.dataLocale = dataLocale
        this.displayedProperties = displayedProperties
        this.pageSize = pageSize
        this.pageNumber = pageNumber
    }

    toSerializable(): EntityViewerTabDataDto {
        return {
            queryLanguage: this.queryLanguage,
            filterBy: this.filterBy,
            orderBy: this.orderBy,
            dataLocale: this.dataLocale,
            displayedProperties: this.displayedProperties?.map(key => key.toString()),
            pageSize: this.pageSize,
            pageNumber: this.pageNumber
        }
    }
}
