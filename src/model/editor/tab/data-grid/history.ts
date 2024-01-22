import { TabHistoryKey } from '@/model/editor/tab/tab-history-key'
import { DataGridDataPointer } from '@/model/editor/data-grid'
import { TabType } from '@/model/editor/tab/tab-type'

/**
 * Defines type of individual filter by input records
 */
export type FilterByHistoryRecord = string
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

/**
 * Defines type of individual order by input records
 */
export type OrderByHistoryRecord = string
/**
 * Defines type of order by input history key
 */
export type OrderByHistoryKey = TabHistoryKey<OrderByHistoryRecord>

/**
 * Creates new history key for currently opened tab
 */
export function createOrderByByHistoryKey(dataPointer: DataGridDataPointer): OrderByHistoryKey {
    return new TabHistoryKey<OrderByHistoryRecord>(
        dataPointer.connection,
        TabType.DataGrid,
        [dataPointer.catalogName, dataPointer.entityType, 'orderBy']
    )
}
