import { ModuleRegistrar } from '@/ModuleRegistrar'
import {
    SchemaViewerService,
    schemaViewerServiceInjectionKey
} from '@/modules/schema-viewer/viewer/service/SchemaViewerService'
import { ConnectionService, connectionServiceInjectionKey } from '@/modules/connection/service/ConnectionService'
import {
    SchemaViewerTabFactory,
    schemaViewerTabFactoryInjectionKey
} from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'

// todo docs
export class SchemaViewerModuleRegistrar implements ModuleRegistrar {

    register(builder: ModuleContextBuilder): void {
        const connectionService: ConnectionService = builder.inject(connectionServiceInjectionKey)

        builder.provide(
            schemaViewerServiceInjectionKey,
            new SchemaViewerService(connectionService)
        )
        // todo lho fix circular dep
        // builder.provide(
        //     schemaViewerTabFactoryInjectionKey,
        //     new SchemaViewerTabFactory(connectionService)
        // )
    }
}
