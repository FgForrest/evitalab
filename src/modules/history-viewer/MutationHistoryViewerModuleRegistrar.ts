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
    evitaQLConsoleTabFactoryInjectionKey
} from '@/modules/evitaql-console/console/workspace/service/EvitaQLConsoleTabFactory.ts'
import { type WorkspaceService, workspaceServiceInjectionKey } from '@/modules/workspace/service/WorkspaceService.ts'
import { MutationHistorySchemaVisualiser } from '@/modules/history-viewer/service/MutationHistorySchemaVisualiser.ts'
import { MutationHistoryDataVisualiser } from '@/modules/history-viewer/service/MutationHistoryDataVisualiser.ts'
import {
    type MutationHistoryViewerTabFactory, mutationHistoryViewerTabFactoryInjectionKey
} from '@/modules/history-viewer/service/MutationHistoryViewerTabFactory.ts'

export class MutationHistoryViewerModuleRegistrar implements ModuleRegistrar {
    register(builder: ModuleContextBuilder): void {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)
        const workspaceService: WorkspaceService = builder.inject(workspaceServiceInjectionKey)
        builder.inject(evitaQLConsoleTabFactoryInjectionKey) // Ensure dependency is injected
        const mutationHistoryViewerTabFactory: MutationHistoryViewerTabFactory = builder.inject(mutationHistoryViewerTabFactoryInjectionKey)

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
