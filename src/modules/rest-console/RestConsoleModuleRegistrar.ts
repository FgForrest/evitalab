import type { ModuleRegistrar } from '@/ModuleRegistrar'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import { EvitaClient, evitaClientInjectionKey } from '@/modules/database-driver/EvitaClient'
import { ConnectionService, connectionServiceInjectionKey } from '@/modules/connection/service/ConnectionService'
import {
    TabFactoryRegistry,
    tabFactoryRegistryInjectionKey
} from '@/modules/workspace/tab/service/TabFactoryRegistry'
import {
    RestConsoleService,
    restConsoleServiceInjectionKey
} from '@/modules/rest-console/console/service/RestConsoleService'
import {
    RestResultVisualiserService,
    restResultVisualiserServiceInjectionKey
} from '@/modules/rest-console/console/result-visualiser/service/RestResultVisualiserService'
import {
    RestConsoleTabFactory,
    restConsoleTabFactoryInjectionKey
} from '@/modules/rest-console/console/workspace/service/RestConsoleTabFactory'

/**
 * Registers the REST console: its tab factory (also contributed into the tab factory registry), the console service
 * and the REST result visualiser service.
 */
export class RestConsoleModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)
        const connectionService: ConnectionService = builder.inject(connectionServiceInjectionKey)
        const tabFactoryRegistry: TabFactoryRegistry = builder.inject(tabFactoryRegistryInjectionKey)

        const restConsoleTabFactory: RestConsoleTabFactory = new RestConsoleTabFactory(connectionService)
        builder.provide(restConsoleTabFactoryInjectionKey, restConsoleTabFactory)
        tabFactoryRegistry.register(restConsoleTabFactory)

        builder.provide(restConsoleServiceInjectionKey, new RestConsoleService(evitaClient))
        builder.provide(restResultVisualiserServiceInjectionKey, new RestResultVisualiserService(evitaClient))
    }
}
