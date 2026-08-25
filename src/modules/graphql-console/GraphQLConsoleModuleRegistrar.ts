import type { ModuleRegistrar } from '@/ModuleRegistrar'
import {
    GraphQLConsoleService,
    graphQLConsoleServiceInjectionKey
} from '@/modules/graphql-console/console/service/GraphQLConsoleService'
import {
    GraphQLResultVisualiserService,
    graphQLResultVisualiserServiceInjectionKey
} from '@/modules/graphql-console/console/result-visualiser/service/GraphQLResultVisualiserService'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import { EvitaClient, evitaClientInjectionKey } from '@/modules/database-driver/EvitaClient'
import { ConnectionService, connectionServiceInjectionKey } from '@/modules/connection/service/ConnectionService'
import {
    TabFactoryRegistry,
    tabFactoryRegistryInjectionKey
} from '@/modules/workspace/tab/service/TabFactoryRegistry'
import {
    GraphQLConsoleTabFactory,
    graphQLConsoleTabFactoryInjectionKey
} from '@/modules/graphql-console/console/workspace/service/GraphQLConsoleTabFactory'
import {
    GraphQLConsoleDemoSnippetHandler
} from '@/modules/graphql-console/console/workspace/service/GraphQLConsoleDemoSnippetHandler'
import { DemoSnippetResolver, demoSnippetResolverInjectionKey } from '@/modules/workspace/service/DemoSnippetResolver'

export class GraphQLConsoleModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)
        const connectionService: ConnectionService = builder.inject(connectionServiceInjectionKey)
        const tabFactoryRegistry: TabFactoryRegistry = builder.inject(tabFactoryRegistryInjectionKey)
        const demoSnippetResolver: DemoSnippetResolver = builder.inject(demoSnippetResolverInjectionKey)

        const graphQLConsoleTabFactory: GraphQLConsoleTabFactory = new GraphQLConsoleTabFactory(connectionService)
        builder.provide(graphQLConsoleTabFactoryInjectionKey, graphQLConsoleTabFactory)
        tabFactoryRegistry.register(graphQLConsoleTabFactory)
        demoSnippetResolver.registerHandler(new GraphQLConsoleDemoSnippetHandler(graphQLConsoleTabFactory))

        builder.provide(
            graphQLConsoleServiceInjectionKey,
            new GraphQLConsoleService(evitaClient)
        )
        builder.provide(
            graphQLResultVisualiserServiceInjectionKey,
            new GraphQLResultVisualiserService(evitaClient)
        )
    }
}
