import type { ModuleRegistrar } from '@/ModuleRegistrar'
import {
    GraphQLConsoleService,
    graphQLConsoleServiceInjectionKey
} from '@/modules/graphql-console/console/service/GraphQLConsoleService'
import {
    GraphQLResultVisualiserService,
    graphQLResultVisualiserServiceInjectionKey
} from '@/modules/graphql-console/console/result-visualiser/service/GraphQLResultVisualiserService'
// GraphQLConsoleTabFactory is commented out due to circular dependency - see todo below
// import {
//     GraphQLConsoleTabFactory,
//     graphQLConsoleTabFactoryInjectionKey
// } from '@/modules/graphql-console/console/workspace/service/GraphQLConsoleTabFactory'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import { EvitaClient, evitaClientInjectionKey } from '@/modules/database-driver/EvitaClient'

export class GraphQLConsoleModuleRegistrar implements ModuleRegistrar {

    register(builder: ModuleContextBuilder): void {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)

        builder.provide(
            graphQLConsoleServiceInjectionKey,
            new GraphQLConsoleService(evitaClient)
        )
        builder.provide(
            graphQLResultVisualiserServiceInjectionKey,
            new GraphQLResultVisualiserService(evitaClient)
        )
        // todo lho fix circular dep
        // builder.provide(
        //     graphQLConsoleTabFactoryInjectionKey,
        //     new GraphQLConsoleTabFactory(connectionService)
        // )
    }
}
