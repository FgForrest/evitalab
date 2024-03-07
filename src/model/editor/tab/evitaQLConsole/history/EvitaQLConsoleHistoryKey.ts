import { TabHistoryKey } from '@/model/editor/tab/history/TabHistoryKey'
import { EvitaQLDataPointer } from '@/model/editor/tab/evitaQLConsole/EvitaQLDataPointer'
import { TabType } from '@/model/editor/tab/TabType'
import { EvitaQLConsoleHistoryRecord } from '@/model/editor/tab/evitaQLConsole/history/EvitaQLConsoleHistoryRecord'

/**
 * Defines type of EvitaQL console history key
 */
export type EvitaQLConsoleHistoryKey = TabHistoryKey<EvitaQLConsoleHistoryRecord>

/**
 * Creates new history key for currently opened tab
 */
export function createEvitaQLConsoleHistoryKey(instancePointer: EvitaQLDataPointer): EvitaQLConsoleHistoryKey {
    return new TabHistoryKey<EvitaQLConsoleHistoryRecord>(
        instancePointer.connection,
        TabType.EvitaQLConsole,
        [instancePointer.catalogName, 'queryAndVariables']
    )
}
