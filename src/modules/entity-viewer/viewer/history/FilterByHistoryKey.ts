import { TabHistoryKey } from '@/modules/workspace/tab/model/TabHistoryKey'
import { FilterByHistoryRecord } from '@/modules/entity-viewer/viewer/history/FilterByHistoryRecord'
import { EntityViewerDataPointer } from '@/modules/entity-viewer/viewer/model/EntityViewerDataPointer'
import { TabType } from '@/modules/workspace/tab/model/TabType'

/**
 * Defines type of filter by input history key
 */
export type FilterByHistoryKey = TabHistoryKey<FilterByHistoryRecord>

/**
 * Creates new history key for currently opened tab
 */
export function createFilterByHistoryKey(dataPointer: EntityViewerDataPointer): FilterByHistoryKey {
    return new TabHistoryKey<FilterByHistoryRecord>(
        dataPointer.connection,
        TabType.EntityViewer,
        [dataPointer.catalogName, dataPointer.entityType, 'filterBy']
    )
}
