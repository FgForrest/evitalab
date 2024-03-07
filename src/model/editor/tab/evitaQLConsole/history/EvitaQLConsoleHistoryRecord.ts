import { v4 as uuidv4 } from 'uuid'

/**
 * Defines type of individual EvitaQL console history records.
 * First element is a unique record ID, second is a query, third is a variables.
 */
export type EvitaQLConsoleHistoryRecord = [string, string, string]

/**
 * Creates new history record for EvitaQL console
 */
export function createEvitaQLConsoleHistoryRecord(query?: string, variables?: string): EvitaQLConsoleHistoryRecord {
    return [uuidv4(), query ?? '', variables ?? '']
}
