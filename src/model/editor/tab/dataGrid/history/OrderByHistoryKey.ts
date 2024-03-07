import { TabHistoryKey } from '@/model/editor/tab/history/TabHistoryKey'
import { DataGridDataPointer } from '@/model/editor/tab/dataGrid/data-grid'
import { TabType } from '@/model/editor/tab/TabType'
import { OrderByHistoryRecord } from '@/model/editor/tab/dataGrid/history/OrderByHistoryRecord'

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
