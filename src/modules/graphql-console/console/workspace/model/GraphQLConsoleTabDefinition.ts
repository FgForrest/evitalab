import GraphQLConsole from '@/modules/graphql-console/console/component/GraphQLConsole.vue'
import { DefineComponent, markRaw } from 'vue'
import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { GraphQLConsoleTabParams } from '@/modules/graphql-console/console/workspace/model/GraphQLConsoleTabParams'
import { GraphQLConsoleTabData } from '@/modules/graphql-console/console/workspace/model/GraphQLConsoleTabData'
import { TabType } from '@/modules/workspace/tab/model/TabType'

/**
 * Defines a GraphQL console tab.
 */
export class GraphQLConsoleTabDefinition extends TabDefinition<GraphQLConsoleTabParams, GraphQLConsoleTabData> {

    constructor(title: string, params: GraphQLConsoleTabParams, initialData: GraphQLConsoleTabData) {
        super(
            undefined,
            title,
            'mdi-graphql',
            markRaw(GraphQLConsole as DefineComponent<any, any, any>),
            params,
            initialData
        )
    }

    get type(): TabType {
        return TabType.GraphQLConsole
    }
}

