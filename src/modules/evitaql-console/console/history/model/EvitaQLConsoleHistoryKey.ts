import { TabHistoryKey } from '@/modules/workspace/tab/model/TabHistoryKey'
import {
    EvitaQLConsoleHistoryRecord
} from '@/modules/evitaql-console/console/history/model/EvitaQLConsoleHistoryRecord'
import { EvitaQLConsoleDataPointer } from '@/modules/evitaql-console/console/model/EvitaQLConsoleDataPointer'
import { TabType } from '@/modules/workspace/tab/model/TabType'

/**
 * Defines type of EvitaQL console history key
 */
export type EvitaQLConsoleHistoryKey = TabHistoryKey<EvitaQLConsoleHistoryRecord>

/**
 * Creates new history key for currently opened tab
 */
export function createEvitaQLConsoleHistoryKey(instancePointer: EvitaQLConsoleDataPointer): EvitaQLConsoleHistoryKey {
    return new TabHistoryKey<EvitaQLConsoleHistoryRecord>(
        instancePointer.connection,
        TabType.EvitaQLConsole,
        [instancePointer.catalogName, 'queryAndVariables']
    )
}
