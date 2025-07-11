import type { ModuleRegistrar } from '@/ModuleRegistrar'
import {
    EntityViewerService,
    entityViewerServiceInjectionKey
} from '@/modules/entity-viewer/viewer/service/EntityViewerService'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import { EvitaClient, evitaClientInjectionKey } from '@/modules/database-driver/EvitaClient'
import {
    CodeDetailRendererMenuFactory,
    codeDetailRendererMenuFactoryInjectionKey
} from '@/modules/entity-viewer/viewer/service/CodeDetailRendererMenuFactory'
import {
    MarkdownDetailRendererMenuFactory,
    markdownDetailRendererMenuFactoryInjectionKey
} from '@/modules/entity-viewer/viewer/service/MarkdownDetailRendererMenuFactory'

export class EntityViewerModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)

        builder.provide(
            entityViewerServiceInjectionKey,
            new EntityViewerService(evitaClient)
        )
        builder.provide(
            codeDetailRendererMenuFactoryInjectionKey,
            new CodeDetailRendererMenuFactory()
        )
        builder.provide(
            markdownDetailRendererMenuFactoryInjectionKey,
            new MarkdownDetailRendererMenuFactory()
        )
        // todo lho fix circular dep
        // builder.provide(entityViewerTabFactoryInjectionKey, new EntityViewerTabFactory(connectionService))
    }
}
