import { ModuleRegistrar } from '@/ModuleRegistrar'
import {
    EntityViewerService,
    entityViewerServiceInjectionKey
} from '@/modules/entity-viewer/viewer/service/EntityViewerService'
import { ConnectionService, connectionServiceInjectionKey } from '@/modules/connection/service/ConnectionService'
import {
    EvitaDBDriverResolver,
    evitaDBDriverResolverInjectionKey
} from '@/modules/connection/driver/EvitaDBDriverResolver'
import { GraphQLClient, graphQLClientInjectionKey } from '@/modules/graphql-console/driver/service/GraphQLClient'
import {
    EntityViewerTabFactory,
    entityViewerTabFactoryInjectionKey
} from '@/modules/entity-viewer/viewer/workspace/service/EntityViewerTabFactory'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'

// todo docs
export class EntityViewerModuleRegistrar implements ModuleRegistrar {

    register(builder: ModuleContextBuilder): void {
        const connectionService: ConnectionService = builder.inject(connectionServiceInjectionKey)
        const evitaDBDriverResolver: EvitaDBDriverResolver = builder.inject(evitaDBDriverResolverInjectionKey)
        const graphQLClient: GraphQLClient = builder.inject(graphQLClientInjectionKey)

        builder.provide(
            entityViewerServiceInjectionKey,
            new EntityViewerService(
                connectionService,
                evitaDBDriverResolver,
                graphQLClient
            )
        )
        // todo lho fix circular dep
        // builder.provide(entityViewerTabFactoryInjectionKey, new EntityViewerTabFactory(connectionService))
    }
}
