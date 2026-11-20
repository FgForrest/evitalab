import { TabHistoryKey } from '@/modules/workspace/tab/model/TabHistoryKey'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import type { RestConsoleHistoryRecord } from '@/modules/rest-console/console/history/model/RestConsoleHistoryRecord'
import { RestConsoleDataPointer } from '@/modules/rest-console/console/model/RestConsoleDataPointer'

/**
 * Defines type of REST console history key
 */
export type RestConsoleHistoryKey = TabHistoryKey<RestConsoleHistoryRecord>

/**
 * Creates new history key for the REST API instance of a tab.
 */
export function createRestConsoleHistoryKey(dataPointer: RestConsoleDataPointer): RestConsoleHistoryKey {
    return new TabHistoryKey<RestConsoleHistoryRecord>(
        dataPointer.connection,
        TabType.RestConsole,
        [dataPointer.catalogName, dataPointer.instanceType, 'requests']
    )
}
