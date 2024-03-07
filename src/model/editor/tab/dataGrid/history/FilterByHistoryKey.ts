import { TabHistoryKey } from '@/model/editor/tab/history/TabHistoryKey'
import { DataGridDataPointer } from '@/model/editor/tab/dataGrid/data-grid'
import { TabType } from '@/model/editor/tab/TabType'
import { FilterByHistoryRecord } from '@/model/editor/tab/dataGrid/history/FilterByHistoryRecord'

/**
 * Defines type of filter by input history key
 */
export type FilterByHistoryKey = TabHistoryKey<FilterByHistoryRecord>

/**
 * Creates new history key for currently opened tab
 */
export function createFilterByHistoryKey(dataPointer: DataGridDataPointer): FilterByHistoryKey {
    return new TabHistoryKey<FilterByHistoryRecord>(
        dataPointer.connection,
        TabType.DataGrid,
        [dataPointer.catalogName, dataPointer.entityType, 'filterBy']
    )
}
