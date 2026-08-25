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
import { ConnectionService, connectionServiceInjectionKey } from '@/modules/connection/service/ConnectionService'
import {
    TabFactoryRegistry,
    tabFactoryRegistryInjectionKey
} from '@/modules/workspace/tab/service/TabFactoryRegistry'
import {
    EntityViewerTabFactory,
    entityViewerTabFactoryInjectionKey
} from '@/modules/entity-viewer/viewer/workspace/service/EntityViewerTabFactory'
import {
    MutationHistoryViewerTabFactory,
    mutationHistoryViewerTabFactoryInjectionKey
} from '@/modules/history-viewer/service/MutationHistoryViewerTabFactory'

export class EntityViewerModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)
        const connectionService: ConnectionService = builder.inject(connectionServiceInjectionKey)
        const workspaceService: WorkspaceService = builder.inject(workspaceServiceInjectionKey)
        const tabFactoryRegistry: TabFactoryRegistry = builder.inject(tabFactoryRegistryInjectionKey)
        const mutationHistoryViewerTabFactory: MutationHistoryViewerTabFactory = builder.inject(mutationHistoryViewerTabFactoryInjectionKey)

        const entityViewerTabFactory: EntityViewerTabFactory = new EntityViewerTabFactory(connectionService)
        builder.provide(entityViewerTabFactoryInjectionKey, entityViewerTabFactory)
        tabFactoryRegistry.register(entityViewerTabFactory)

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
            new EntityGridCellMenuFactory(workspaceService, mutationHistoryViewerTabFactory)
        )
    }
}
