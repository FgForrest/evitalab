import type { ModuleRegistrar } from '@/ModuleRegistrar'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import {
    ServerViewerService,
    serverViewerServiceInjectionKey
} from '@/modules/server-viewer/service/ServerViewerService'
import { EvitaClient, evitaClientInjectionKey } from '@/modules/database-driver/EvitaClient'
import { ConnectionService, connectionServiceInjectionKey } from '@/modules/connection/service/ConnectionService'
import {
    TabFactoryRegistry,
    tabFactoryRegistryInjectionKey
} from '@/modules/workspace/tab/service/TabFactoryRegistry'
import {
    ServerViewerTabFactory,
    serverViewerTabFactoryInjectionKey
} from '@/modules/server-viewer/service/ServerViewerTabFactory'

export class ServerViewerModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)
        const connectionService: ConnectionService = builder.inject(connectionServiceInjectionKey)
        const tabFactoryRegistry: TabFactoryRegistry = builder.inject(tabFactoryRegistryInjectionKey)

        const serverViewerTabFactory: ServerViewerTabFactory = new ServerViewerTabFactory(connectionService)
        builder.provide(serverViewerTabFactoryInjectionKey, serverViewerTabFactory)
        tabFactoryRegistry.register(serverViewerTabFactory)

        const serverViewerService: ServerViewerService = new ServerViewerService(evitaClient)
        builder.provide(serverViewerServiceInjectionKey, serverViewerService)
    }
}
