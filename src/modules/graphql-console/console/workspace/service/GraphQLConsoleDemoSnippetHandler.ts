import type { DemoSnippetHandler } from '@/modules/workspace/service/DemoSnippetHandler'
import {
    GraphQLConsoleTabDefinition
} from '@/modules/graphql-console/console/workspace/model/GraphQLConsoleTabDefinition'
import { GraphQLConsoleTabData } from '@/modules/graphql-console/console/workspace/model/GraphQLConsoleTabData'
import { GraphQLInstanceType } from '@/modules/graphql-console/console/model/GraphQLInstanceType'
import {
    GraphQLConsoleTabFactory
} from '@/modules/graphql-console/console/workspace/service/GraphQLConsoleTabFactory'

/**
 * Opens GraphQL demo code snippets in the GraphQL console.
 */
export class GraphQLConsoleDemoSnippetHandler implements DemoSnippetHandler {

    readonly codeSnippetType: string = 'graphql'

    private readonly graphQLConsoleTabFactory: GraphQLConsoleTabFactory

    constructor(graphQLConsoleTabFactory: GraphQLConsoleTabFactory) {
        this.graphQLConsoleTabFactory = graphQLConsoleTabFactory
    }

    createTab(catalogName: string, snippetContent: string): GraphQLConsoleTabDefinition {
        return this.graphQLConsoleTabFactory.createNew(
            catalogName,
            GraphQLInstanceType.Data,
            new GraphQLConsoleTabData(snippetContent),
            true
        )
    }
}
