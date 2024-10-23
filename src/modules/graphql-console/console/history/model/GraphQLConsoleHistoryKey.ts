import { TabHistoryKey } from '@/modules/workspace/tab/model/TabHistoryKey'
import {
    GraphQLConsoleHistoryRecord
} from '@/modules/graphql-console/console/history/model/GraphQLConsoleHistoryRecord'
import { GraphQLConsoleDataPointer } from '@/modules/graphql-console/console/model/GraphQLConsoleDataPointer'
import { TabType } from '@/modules/workspace/tab/model/TabType'

/**
 * Defines type of GraphQL console history key
 */
export type GraphQLConsoleHistoryKey = TabHistoryKey<GraphQLConsoleHistoryRecord>

/**
 * Creates new history key for currently opened tab
 */
export function createGraphQLConsoleHistoryKey(instancePointer: GraphQLConsoleDataPointer): GraphQLConsoleHistoryKey {
    return new TabHistoryKey<GraphQLConsoleHistoryRecord>(
        instancePointer.connection,
        TabType.GraphQLConsole,
        [instancePointer.catalogName, instancePointer.instanceType, 'queryAndVariables']
    )
}

