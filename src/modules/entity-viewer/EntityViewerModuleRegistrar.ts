import { ModuleRegistrar } from '@/ModuleRegistrar'
import {
    EntityViewerService,
    entityViewerServiceInjectionKey
} from '@/modules/entity-viewer/viewer/service/EntityViewerService'
import {
    EntityViewerTabFactory,
    entityViewerTabFactoryInjectionKey
} from '@/modules/entity-viewer/viewer/workspace/service/EntityViewerTabFactory'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import { EvitaClient, evitaClientInjectionKey } from '@/modules/database-driver/EvitaClient'

export class EntityViewerModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)

        builder.provide(
            entityViewerServiceInjectionKey,
            new EntityViewerService(evitaClient)
        )
        // todo lho fix circular dep
        // builder.provide(entityViewerTabFactoryInjectionKey, new EntityViewerTabFactory(connectionService))
    }
}
