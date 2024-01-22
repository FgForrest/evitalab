import { TabHistoryKey } from '@/model/editor/tab/tab-history-key'
import { TabType } from '@/model/editor/tab/tab-type'
import { v4 as uuidv4 } from 'uuid'
import { EvitaQLDataPointer } from '@/model/editor/evitaql-console'

/**
 * Defines type of individual EvitaQL console history records.
 * First element is a unique record ID, second is a query, third is a variables.
 */
export type EvitaQLConsoleHistoryRecord = [string, string, string]

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

/**
 * Creates new history record for EvitaQL console
 */
export function createEvitaQLConsoleHistoryRecord(query?: string, variables?: string): EvitaQLConsoleHistoryRecord {
    return [uuidv4(), query ?? '', variables ?? '']
}
