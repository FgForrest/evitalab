import { TabHistoryKey } from '@/modules/workspace/tab/model/TabHistoryKey'
import { OrderByHistoryRecord } from '@/modules/entity-viewer/viewer/history/OrderByHistoryRecord'
import { EntityViewerDataPointer } from '@/modules/entity-viewer/viewer/model/EntityViewerDataPointer'
import { TabType } from '@/modules/workspace/tab/model/TabType'

/**
 * Defines type of order by input history key
 */
export type OrderByHistoryKey = TabHistoryKey<OrderByHistoryRecord>

/**
 * Creates new history key for currently opened tab
 */
export function createOrderByByHistoryKey(dataPointer: EntityViewerDataPointer): OrderByHistoryKey {
    return new TabHistoryKey<OrderByHistoryRecord>(
        dataPointer.connection,
        TabType.EntityViewer,
        [dataPointer.catalogName, dataPointer.entityType, 'orderBy']
    )
}
