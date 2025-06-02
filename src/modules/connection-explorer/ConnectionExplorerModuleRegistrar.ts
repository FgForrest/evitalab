import { ModuleRegistrar } from '@/ModuleRegistrar'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import {
    CatalogItemService,
    catalogItemServiceInjectionKey
} from '@/modules/connection-explorer/service/CatalogItemService'
import {
    CollectionItemService,
    collectionItemServiceInjectionKey
} from '@/modules/connection-explorer/service/CollectionItemService'
import { EvitaClient, evitaClientInjectionKey } from '@/modules/database-driver/EvitaClient'
import {
    ConnectionExplorerService,
    connectionExplorerServiceInjectionKey
} from '@/modules/connection-explorer/service/ConnectionExplorerService'
import {
    ConnectionExplorerPanelMenuFactory, connectionExplorerPanelMenuFactoryInjectionKey
} from '@/modules/connection-explorer/service/ConnectionExplorerPanelMenuFactory'
import { WorkspaceService, workspaceServiceInjectionKey } from '@/modules/workspace/service/WorkspaceService'
import {
    ServerViewerTabFactory,
    serverViewerTabFactoryInjectionKey
} from '@/modules/server-viewer/service/ServerViewerTabFactory'
import {
    TaskViewerTabFactory,
    taskViewerTabFactoryInjectionKey
} from '@/modules/task-viewer/services/TaskViewerTabFactory'
import {
    TrafficRecordingsViewerTabFactory,
    trafficRecordingsViewerTabFactoryInjectionKey
} from '@/modules/traffic-viewer/service/TrafficRecordingsViewerTabFactory'
import {
    GraphQLConsoleTabFactory,
    graphQLConsoleTabFactoryInjectionKey
} from '@/modules/graphql-console/console/workspace/service/GraphQLConsoleTabFactory'
import {
    BackupViewerTabFactory,
    backupViewerTabFactoryInjectionKey
} from '@/modules/backup-viewer/service/BackupViewerTabFactory'
import { JfrViewerTabFactory, jfrViewerTabFactoryInjectionKey } from '@/modules/jfr-viewer/service/JfrViewerTabFactory'

export class ConnectionExplorerModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)
        const workspaceService: WorkspaceService = builder.inject(workspaceServiceInjectionKey)
        const serverViewerTabFactory: ServerViewerTabFactory = builder.inject(serverViewerTabFactoryInjectionKey)
        const taskViewerTabFactory: TaskViewerTabFactory = builder.inject(taskViewerTabFactoryInjectionKey)
        const trafficRecordingsViewerTabFactory: TrafficRecordingsViewerTabFactory = builder.inject(trafficRecordingsViewerTabFactoryInjectionKey)
        const jfrViewerTabFactory: JfrViewerTabFactory = builder.inject(jfrViewerTabFactoryInjectionKey)
        const graphQLConsoleTabFactory: GraphQLConsoleTabFactory = builder.inject(graphQLConsoleTabFactoryInjectionKey)
        const backupViewerTabFactory: BackupViewerTabFactory = builder.inject(backupViewerTabFactoryInjectionKey)

        const connectionExplorerService: ConnectionExplorerService = new ConnectionExplorerService(evitaClient)
        const connectionExplorerPanelMenuFactory: ConnectionExplorerPanelMenuFactory = new ConnectionExplorerPanelMenuFactory(
            evitaClient,
            workspaceService,
            serverViewerTabFactory,
            taskViewerTabFactory,
            trafficRecordingsViewerTabFactory,
            jfrViewerTabFactory,
            graphQLConsoleTabFactory,
            backupViewerTabFactory
        )
        const catalogItemService: CatalogItemService = new CatalogItemService(evitaClient)
        const collectionItemService: CollectionItemService = new CollectionItemService(evitaClient)

        builder.provide(connectionExplorerServiceInjectionKey, connectionExplorerService)
        builder.provide(connectionExplorerPanelMenuFactoryInjectionKey, connectionExplorerPanelMenuFactory)
        builder.provide(catalogItemServiceInjectionKey, catalogItemService)
        builder.provide(collectionItemServiceInjectionKey, collectionItemService)
    }

}
