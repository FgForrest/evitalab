import { ModuleRegistrar } from '@/ModuleRegistrar'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import {
    TrafficViewerService,
    trafficViewerServiceInjectionKey
} from '@/modules/traffic-viewer/service/TrafficViewerService'
import { List as ImmutableList } from 'immutable'
import { SourceQueryContainerVisualiser } from '@/modules/traffic-viewer/service/SourceQueryContainerVisualiser'
import { WorkspaceService, workspaceServiceInjectionKey } from '@/modules/workspace/service/WorkspaceService'
import {
    GraphQLConsoleTabFactory,
    graphQLConsoleTabFactoryInjectionKey
} from '@/modules/graphql-console/console/workspace/service/GraphQLConsoleTabFactory'
import {
    SourceQueryStatisticsContainerVisualiser
} from '@/modules/traffic-viewer/service/SourceQueryStatisticsContainerVisualiser'
import { SessionStartContainerVisualiser } from '@/modules/traffic-viewer/service/SessionStartContainerVisualiser'
import { SessionCloseContainerVisualiser } from '@/modules/traffic-viewer/service/SessionCloseContainerVisualiser'
import { QueryContainerVisualiser } from '@/modules/traffic-viewer/service/QueryContainerVisualiser'
import {
    EvitaQLConsoleTabFactory,
    evitaQLConsoleTabFactoryInjectionKey
} from '@/modules/evitaql-console/console/workspace/service/EvitaQLConsoleTabFactory'
import {
    TrafficRecordHistoryVisualisationProcessor
} from '@/modules/traffic-viewer/service/TrafficRecordHistoryVisualisationProcessor'
import {
    EntityEnrichmentContainerVisualiser
} from '@/modules/traffic-viewer/service/EntityEnrichmentContainerVisualiser'
import { EntityFetchContainerVisualiser } from '@/modules/traffic-viewer/service/EntityFetchContainerVisualiser'
import { MutationContainerVisualiser } from '@/modules/traffic-viewer/service/MutationContainerVisualiser'
import {
    TrafficRecordHistoryViewerTabFactory, trafficRecordHistoryViewerTabFactoryInjectionKey
} from '@/modules/traffic-viewer/service/TrafficRecordHistoryViewerTabFactory'
import { EvitaClient, evitaClientInjectionKey } from '@/modules/database-driver/EvitaClient'

export class TrafficViewerModuleRegistrar implements ModuleRegistrar {
    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)
        const workspaceService: WorkspaceService = builder.inject(workspaceServiceInjectionKey)
        const evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory = builder.inject(evitaQLConsoleTabFactoryInjectionKey)
        const graphQLConsoleTabFactory: GraphQLConsoleTabFactory = builder.inject(graphQLConsoleTabFactoryInjectionKey)
        const trafficRecordHistoryViewerTabFactory: TrafficRecordHistoryViewerTabFactory = builder.inject(trafficRecordHistoryViewerTabFactoryInjectionKey)

        const trafficViewerService: TrafficViewerService = new TrafficViewerService(
            evitaClient,
            new TrafficRecordHistoryVisualisationProcessor(
                evitaClient,
                ImmutableList([
                    new EntityEnrichmentContainerVisualiser(
                        workspaceService,
                        evitaQLConsoleTabFactory
                    ),
                    new EntityFetchContainerVisualiser(
                        workspaceService,
                        evitaQLConsoleTabFactory
                    ),
                    new MutationContainerVisualiser(),
                    new QueryContainerVisualiser(
                        workspaceService,
                        evitaQLConsoleTabFactory
                    ),
                    new SessionCloseContainerVisualiser(),
                    new SessionStartContainerVisualiser(
                        workspaceService,
                        trafficRecordHistoryViewerTabFactory
                    ),
                    new SourceQueryContainerVisualiser(
                        workspaceService,
                        graphQLConsoleTabFactory,
                        evitaQLConsoleTabFactory
                    ),
                    new SourceQueryStatisticsContainerVisualiser()
                ])
            )
        )
        builder.provide(trafficViewerServiceInjectionKey, trafficViewerService)
    }
}
