import { GraphQLInstancePointer } from '@/model/editor/tab/graphQLConsole/GraphQLInstancePointer'
import { TabType } from '@/model/editor/tab/TabType'
import { TabHistoryKey } from '@/model/editor/tab/history/TabHistoryKey'
import { GraphQLConsoleHistoryRecord } from '@/model/editor/tab/graphQLConsole/history/GraphQLConsoleHistoryRecord'

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

