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
import {
    EvitaQLConsoleTabFactory,
    evitaQLConsoleTabFactoryInjectionKey
} from '@/modules/evitaql-console/console/workspace/service/EvitaQLConsoleTabFactory.ts'
import { type WorkspaceService, workspaceServiceInjectionKey } from '@/modules/workspace/service/WorkspaceService.ts'
import { MutationHistorySchemaVisualiser } from '@/modules/history-viewer/service/MutationHistorySchemaVisualiser.ts'
import { MutationHistoryDataVisualiser } from '@/modules/history-viewer/service/MutationHistoryDataVisualiser.ts'
import {
    type MutationHistoryViewerTabFactory, mutationHistoryViewerTabFactoryInjectionKey
} from '@/modules/history-viewer/service/MutationHistoryViewerTabFactory.ts'

export class MutationHistoryViewerModuleRegistrar implements ModuleRegistrar {
    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)
        const workspaceService: WorkspaceService = builder.inject(workspaceServiceInjectionKey)
        const evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory = builder.inject(evitaQLConsoleTabFactoryInjectionKey)
        const mutationHistoryViewerTabFactory: MutationHistoryViewerTabFactory = builder.inject(mutationHistoryViewerTabFactoryInjectionKey)

        const mutationHistoryViewerService: MutationHistoryViewerService = new MutationHistoryViewerService(
            evitaClient,
            new MutationHistoryVisualisationProcessor(
                evitaClient,
                ImmutableList([
                    new MutationHistoryTransactionVisualiser(workspaceService, evitaQLConsoleTabFactory),
                    new MutationHistorySchemaVisualiser(workspaceService, evitaQLConsoleTabFactory),
                    new MutationHistoryDataVisualiser(workspaceService, mutationHistoryViewerTabFactory)
                ])
            )
        )
        builder.provide(historyViewerServiceInjectionKey, mutationHistoryViewerService)
    }
}
