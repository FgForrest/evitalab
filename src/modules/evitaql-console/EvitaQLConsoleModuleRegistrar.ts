import type { ModuleRegistrar } from '@/ModuleRegistrar'
import {
    EvitaQLConsoleService,
    evitaQLConsoleServiceInjectionKey
} from '@/modules/evitaql-console/console/service/EvitaQLConsoleService'
import {
    EvitaQLResultVisualiserService,
    evitaQLResultVisualiserServiceInjectionKey
} from '@/modules/evitaql-console/console/result-visualiser/service/EvitaQLResultVisualiserService'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import { EvitaClient, evitaClientInjectionKey } from '@/modules/database-driver/EvitaClient'
import { ConnectionService, connectionServiceInjectionKey } from '@/modules/connection/service/ConnectionService'
import {
    TabFactoryRegistry,
    tabFactoryRegistryInjectionKey
} from '@/modules/workspace/tab/service/TabFactoryRegistry'
import {
    EvitaQLConsoleTabFactory,
    evitaQLConsoleTabFactoryInjectionKey
} from '@/modules/evitaql-console/console/workspace/service/EvitaQLConsoleTabFactory'
import {
    EvitaQLConsoleDemoSnippetHandler
} from '@/modules/evitaql-console/console/workspace/service/EvitaQLConsoleDemoSnippetHandler'
import { DemoSnippetResolver, demoSnippetResolverInjectionKey } from '@/modules/workspace/service/DemoSnippetResolver'

export class EvitaQLConsoleModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)
        const connectionService: ConnectionService = builder.inject(connectionServiceInjectionKey)
        const tabFactoryRegistry: TabFactoryRegistry = builder.inject(tabFactoryRegistryInjectionKey)
        const demoSnippetResolver: DemoSnippetResolver = builder.inject(demoSnippetResolverInjectionKey)

        const evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory = new EvitaQLConsoleTabFactory(connectionService)
        builder.provide(evitaQLConsoleTabFactoryInjectionKey, evitaQLConsoleTabFactory)
        tabFactoryRegistry.register(evitaQLConsoleTabFactory)
        demoSnippetResolver.registerHandler(new EvitaQLConsoleDemoSnippetHandler(evitaQLConsoleTabFactory))

        builder.provide(
            evitaQLConsoleServiceInjectionKey,
            new EvitaQLConsoleService(evitaClient)
        )
        builder.provide(
            evitaQLResultVisualiserServiceInjectionKey,
            new EvitaQLResultVisualiserService(evitaClient)
        )
    }
}
