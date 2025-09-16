import type { ModuleRegistrar } from '@/ModuleRegistrar'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import { EvitaClient, evitaClientInjectionKey } from '@/modules/database-driver/EvitaClient'
import {
    MutationHistoryViewerService,
    historyViewerServiceInjectionKey
} from '@/modules/history-viewer/service/MutationHistoryViewerService.ts'

export class HistoryViewerModuleRegistrar implements ModuleRegistrar {
    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)
        // const workspaceService: WorkspaceService = builder.inject(workspaceServiceInjectionKey)
        // const evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory = builder.inject(evitaQLConsoleTabFactoryInjectionKey)
        // const graphQLConsoleTabFactory: GraphQLConsoleTabFactory = builder.inject(graphQLConsoleTabFactoryInjectionKey)
        // const trafficRecordHistoryViewerTabFactory: TrafficRecordHistoryViewerTabFactory = builder.inject(trafficRecordHistoryViewerTabFactoryInjectionKey)

        const historyViewerService: MutationHistoryViewerService = new MutationHistoryViewerService(
            evitaClient
        )
        builder.provide(historyViewerServiceInjectionKey, historyViewerService)
    }
}
