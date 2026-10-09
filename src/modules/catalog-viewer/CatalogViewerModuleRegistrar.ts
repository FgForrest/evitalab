import type { ModuleRegistrar } from '@/ModuleRegistrar'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import { EvitaClient, evitaClientInjectionKey } from '@/modules/database-driver/EvitaClient'
import { ConnectionService, connectionServiceInjectionKey } from '@/modules/connection/service/ConnectionService'
import {
    TabFactoryRegistry,
    tabFactoryRegistryInjectionKey
} from '@/modules/workspace/tab/service/TabFactoryRegistry'
import {
    CatalogViewerTabFactory,
    catalogViewerTabFactoryInjectionKey
} from '@/modules/catalog-viewer/service/CatalogViewerTabFactory'
import {
    CatalogViewerService,
    catalogViewerServiceInjectionKey
} from '@/modules/catalog-viewer/service/CatalogViewerService'

/**
 * Registers the catalog viewer: its tab factory (also contributed to the tab factory registry) and its service.
 */
export class CatalogViewerModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)
        const connectionService: ConnectionService = builder.inject(connectionServiceInjectionKey)
        const tabFactoryRegistry: TabFactoryRegistry = builder.inject(tabFactoryRegistryInjectionKey)

        const catalogViewerTabFactory: CatalogViewerTabFactory = new CatalogViewerTabFactory(connectionService)
        builder.provide(catalogViewerTabFactoryInjectionKey, catalogViewerTabFactory)
        tabFactoryRegistry.register(catalogViewerTabFactory)

        const catalogViewerService: CatalogViewerService = new CatalogViewerService(evitaClient)
        builder.provide(catalogViewerServiceInjectionKey, catalogViewerService)
    }
}
