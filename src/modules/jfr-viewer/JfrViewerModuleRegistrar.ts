import type { ModuleRegistrar } from '@/ModuleRegistrar'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import { JfrViewerService, jfrViewerServiceInjectionKey } from '@/modules/jfr-viewer/service/JfrViewerService'
import { EvitaClient, evitaClientInjectionKey } from '@/modules/database-driver/EvitaClient'
import { ConnectionService, connectionServiceInjectionKey } from '@/modules/connection/service/ConnectionService'
import {
    TabFactoryRegistry,
    tabFactoryRegistryInjectionKey
} from '@/modules/workspace/tab/service/TabFactoryRegistry'
import {
    JfrViewerTabFactory,
    jfrViewerTabFactoryInjectionKey
} from '@/modules/jfr-viewer/service/JfrViewerTabFactory'

export class JfrViewerModuleRegistrar implements ModuleRegistrar {
    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)
        const connectionService: ConnectionService = builder.inject(connectionServiceInjectionKey)
        const tabFactoryRegistry: TabFactoryRegistry = builder.inject(tabFactoryRegistryInjectionKey)

        const jfrViewerTabFactory: JfrViewerTabFactory = new JfrViewerTabFactory(connectionService)
        builder.provide(jfrViewerTabFactoryInjectionKey, jfrViewerTabFactory)
        tabFactoryRegistry.register(jfrViewerTabFactory)

        const jfrService: JfrViewerService = new JfrViewerService(evitaClient)
        builder.provide(jfrViewerServiceInjectionKey, jfrService)
    }
}
