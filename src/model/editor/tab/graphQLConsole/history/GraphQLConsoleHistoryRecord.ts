import { v4 as uuidv4 } from 'uuid'

/**
 * Defines type of individual GraphQL console history records.
 * First element is a unique record ID, second is a query, third is a variables.
 */
export type GraphQLConsoleHistoryRecord = [string, string, string]

/**
 * Creates new history record for GraphQL console
 */
export function createGraphQLConsoleHistoryRecord(query?: string, variables?: string): GraphQLConsoleHistoryRecord {
    return [uuidv4(), query ?? '', variables ?? '']
}
