import { ModuleRegistrar } from '@/ModuleRegistrar'
import {
    GraphQLConsoleService,
    graphQLConsoleServiceInjectionKey
} from '@/modules/graphql-console/console/service/GraphQLConsoleService'
import {
    GraphQLResultVisualiserService,
    graphQLResultVisualiserServiceInjectionKey
} from '@/modules/graphql-console/console/result-visualiser/service/GraphQLResultVisualiserService'
import { ConnectionService, connectionServiceInjectionKey } from '@/modules/connection/service/ConnectionService'
import {
    GraphQLConsoleTabFactory,
    graphQLConsoleTabFactoryInjectionKey
} from '@/modules/graphql-console/console/workspace/service/GraphQLConsoleTabFactory'
import { GraphQLClient, graphQLClientInjectionKey } from '@/modules/graphql-console/driver/service/GraphQLClient'
import { EvitaLabConfig, evitaLabConfigInjectionKey } from '@/modules/config/EvitaLabConfig'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'

// todo lho
export class GraphQLConsoleModuleRegistrar implements ModuleRegistrar {

    register(builder: ModuleContextBuilder): void {
        const evitaLabConfig: EvitaLabConfig = builder.inject(evitaLabConfigInjectionKey)
        const connectionService: ConnectionService = builder.inject(connectionServiceInjectionKey)

        const graphQLClient: GraphQLClient = new GraphQLClient(evitaLabConfig)

        builder.provide(
            graphQLClientInjectionKey,
            graphQLClient
        )
        builder.provide(
            graphQLConsoleServiceInjectionKey,
            new GraphQLConsoleService(graphQLClient)
        )
        builder.provide(
            graphQLResultVisualiserServiceInjectionKey,
            new GraphQLResultVisualiserService(connectionService)
        )
        // todo lho fix circular dep
        // builder.provide(
        //     graphQLConsoleTabFactoryInjectionKey,
        //     new GraphQLConsoleTabFactory(connectionService)
        // )
    }
}
