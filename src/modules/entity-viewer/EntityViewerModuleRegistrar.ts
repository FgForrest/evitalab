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
import {
    EntityGridCellMenuFactory,
    entityGridCellMenuFactoryInjectionKey
} from '@/modules/entity-viewer/viewer/service/EntityGridCellMenuFactory'
import { WorkspaceService, workspaceServiceInjectionKey } from '@/modules/workspace/service/WorkspaceService'

export class EntityViewerModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)
        const workspaceService: WorkspaceService = builder.inject(workspaceServiceInjectionKey)

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
        builder.provide(
            entityGridCellMenuFactoryInjectionKey,
            new EntityGridCellMenuFactory(workspaceService)
        )
        // todo lho fix circular dep
        // builder.provide(entityViewerTabFactoryInjectionKey, new EntityViewerTabFactory(connectionService))
    }
}
