import type { ModuleRegistrar } from '@/ModuleRegistrar'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import { EvitaClient, evitaClientInjectionKey } from '@/modules/database-driver/EvitaClient'
import {
    historyViewerServiceInjectionKey,
    MutationHistoryViewerService
} from '@/modules/history-viewer/service/MutationHistoryViewerService.ts'
import { List as ImmutableList } from 'immutable'
import {
    MutationHistoryVisualisationProcessor
} from '@/modules/history-viewer/service/MutationHistoryVisualisationProcessor.ts'
import {
    MutationHistoryTransactionVisualiser
} from '@/modules/history-viewer/service/MutationHistoryTransactionVisualiser.ts'
import { type WorkspaceService, workspaceServiceInjectionKey } from '@/modules/workspace/service/WorkspaceService.ts'
import { MutationHistorySchemaVisualiser } from '@/modules/history-viewer/service/MutationHistorySchemaVisualiser.ts'
import { MutationHistoryDataVisualiser } from '@/modules/history-viewer/service/MutationHistoryDataVisualiser.ts'
import {
    MutationHistoryViewerTabFactory, mutationHistoryViewerTabFactoryInjectionKey
} from '@/modules/history-viewer/service/MutationHistoryViewerTabFactory.ts'
import { ConnectionService, connectionServiceInjectionKey } from '@/modules/connection/service/ConnectionService'
import {
    TabFactoryRegistry,
    tabFactoryRegistryInjectionKey
} from '@/modules/workspace/tab/service/TabFactoryRegistry'

export class MutationHistoryViewerModuleRegistrar implements ModuleRegistrar {
    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)
        const connectionService: ConnectionService = builder.inject(connectionServiceInjectionKey)
        const workspaceService: WorkspaceService = builder.inject(workspaceServiceInjectionKey)
        const tabFactoryRegistry: TabFactoryRegistry = builder.inject(tabFactoryRegistryInjectionKey)

        const mutationHistoryViewerTabFactory: MutationHistoryViewerTabFactory = new MutationHistoryViewerTabFactory(connectionService)
        builder.provide(mutationHistoryViewerTabFactoryInjectionKey, mutationHistoryViewerTabFactory)
        tabFactoryRegistry.register(mutationHistoryViewerTabFactory)

        const mutationHistoryViewerService: MutationHistoryViewerService = new MutationHistoryViewerService(
            evitaClient,
            new MutationHistoryVisualisationProcessor(
                ImmutableList([
                    new MutationHistoryTransactionVisualiser(),
                    new MutationHistorySchemaVisualiser(),
                    new MutationHistoryDataVisualiser(workspaceService, mutationHistoryViewerTabFactory)
                ])
            )
        )
        builder.provide(historyViewerServiceInjectionKey, mutationHistoryViewerService)
    }
}
