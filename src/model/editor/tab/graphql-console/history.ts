import { TabHistoryKey } from '@/model/editor/tab/tab-history-key'
import { GraphQLInstancePointer } from '@/model/editor/graphql-console'
import { TabType } from '@/model/editor/tab/tab-type'
import { v4 as uuidv4 } from 'uuid'

/**
 * Defines type of individual GraphQL console history records.
 * First element is a unique record ID, second is a query, third is a variables.
 */
export type GraphQLConsoleHistoryRecord = [string, string, string]

/**
 * Defines type of GraphQL console history key
 */
export type GraphQLConsoleHistoryKey = TabHistoryKey<GraphQLConsoleHistoryRecord>

/**
 * Creates new history key for currently opened tab
 */
export function createGraphQLConsoleHistoryKey(instancePointer: GraphQLInstancePointer): GraphQLConsoleHistoryKey {
    return new TabHistoryKey<GraphQLConsoleHistoryRecord>(
        instancePointer.connection,
        TabType.GraphQLConsole,
        [instancePointer.catalogName, instancePointer.instanceType, 'queryAndVariables']
    )
}

/**
 * Creates new history record for GraphQL console
 */
export function createGraphQLConsoleHistoryRecord(query?: string, variables?: string): GraphQLConsoleHistoryRecord {
    return [uuidv4(), query ?? '', variables ?? '']
}
