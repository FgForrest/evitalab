import { ModuleRegistrar } from '@/ModuleRegistrar'
import {
    SchemaViewerService,
    schemaViewerServiceInjectionKey
} from '@/modules/schema-viewer/viewer/service/SchemaViewerService'
import { ConnectionService, connectionServiceInjectionKey } from '@/modules/connection/service/ConnectionService'
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

// todo docs
export class SchemaViewerModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        const connectionService: ConnectionService = builder.inject(connectionServiceInjectionKey)
        const workspaceService: WorkspaceService = builder.inject(workspaceServiceInjectionKey)
        const schemaViewerTabFactory: SchemaViewerTabFactory = builder.inject(schemaViewerTabFactoryInjectionKey)

        builder.provide(
            schemaViewerServiceInjectionKey,
            new SchemaViewerService(connectionService)
        )
        builder.provide(
            delegatingSchemaPathFactoryInjectionKey,
            new DelegatingSchemaPathFactory(workspaceService, schemaViewerTabFactory)
        )
        // todo lho fix circular dep
        // builder.provide(
        //     schemaViewerTabFactoryInjectionKey,
        //     new SchemaViewerTabFactory(connectionService)
        // )
    }
}
