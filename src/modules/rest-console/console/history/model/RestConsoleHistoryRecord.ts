import { v4 as uuidv4 } from 'uuid'
import type { RestParameterValues } from '@/modules/rest-console/console/model/RestParameterValue'

/**
 * A single executed request in the REST console history. Plain object, because history is persisted as JSON.
 */
export interface RestConsoleHistoryRecord {
    readonly id: string
    readonly operationId: string
    readonly method: string
    readonly pathTemplate: string
    /**
     * The path as it was sent, including the query string — what the history list shows.
     */
    readonly resolvedPath: string
    readonly locale?: string
    readonly parameters: RestParameterValues
    readonly body?: string
}

/**
 * Creates a new history record of the REST console.
 */
export function createRestConsoleHistoryRecord(
    operationId: string,
    method: string,
    pathTemplate: string,
    resolvedPath: string,
    locale: string | undefined,
    parameters: RestParameterValues,
    body: string | undefined
): RestConsoleHistoryRecord {
    return { id: uuidv4(), operationId, method, pathTemplate, resolvedPath, locale, parameters, body }
}
