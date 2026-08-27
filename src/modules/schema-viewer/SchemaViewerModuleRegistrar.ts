import type { ModuleRegistrar } from '@/ModuleRegistrar'
import {
    SchemaViewerService,
    schemaViewerServiceInjectionKey
} from '@/modules/schema-viewer/viewer/service/SchemaViewerService'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import { WorkspaceService, workspaceServiceInjectionKey } from '@/modules/workspace/service/WorkspaceService'
import {
    SchemaViewerTabFactory,
    schemaViewerTabFactoryInjectionKey
} from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import {
    DelegatingSchemaPathFactory,
    delegatingSchemaPathFactoryInjectionKey
} from '@/modules/schema-viewer/viewer/service/schema-path-factory/DelegatingSchemaPathFactory'
import { EvitaClient, evitaClientInjectionKey } from '@/modules/database-driver/EvitaClient'
import { ConnectionService, connectionServiceInjectionKey } from '@/modules/connection/service/ConnectionService'
import {
    TabFactoryRegistry,
    tabFactoryRegistryInjectionKey
} from '@/modules/workspace/tab/service/TabFactoryRegistry'

export class SchemaViewerModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)
        const connectionService: ConnectionService = builder.inject(connectionServiceInjectionKey)
        const workspaceService: WorkspaceService = builder.inject(workspaceServiceInjectionKey)
        const tabFactoryRegistry: TabFactoryRegistry = builder.inject(tabFactoryRegistryInjectionKey)

        const schemaViewerTabFactory: SchemaViewerTabFactory = new SchemaViewerTabFactory(connectionService)
        builder.provide(schemaViewerTabFactoryInjectionKey, schemaViewerTabFactory)
        tabFactoryRegistry.register(schemaViewerTabFactory)

        builder.provide(
            schemaViewerServiceInjectionKey,
            new SchemaViewerService(evitaClient)
        )
        builder.provide(
            delegatingSchemaPathFactoryInjectionKey,
            new DelegatingSchemaPathFactory(workspaceService, schemaViewerTabFactory)
        )
    }
}
