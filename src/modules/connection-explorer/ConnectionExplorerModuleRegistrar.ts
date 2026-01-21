import type { ModuleRegistrar } from '@/ModuleRegistrar'
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
import {
    CatalogItemMenuFactory,
    catalogItemMenuFactoryInjectionKey
} from '@/modules/connection-explorer/service/CatalogItemMenuFactory'
import {
    EvitaQLConsoleTabFactory,
    evitaQLConsoleTabFactoryInjectionKey
} from '@/modules/evitaql-console/console/workspace/service/EvitaQLConsoleTabFactory'
import {
    SchemaViewerTabFactory,
    schemaViewerTabFactoryInjectionKey
} from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import {
    TrafficRecordHistoryViewerTabFactory, trafficRecordHistoryViewerTabFactoryInjectionKey
} from '@/modules/traffic-viewer/service/TrafficRecordHistoryViewerTabFactory'
import {
    CollectionItemMenuFactory,
    collectionItemMenuFactoryInjectionKey
} from '@/modules/connection-explorer/service/CollectionItemMenuFactory'
import {
    EntityViewerTabFactory,
    entityViewerTabFactoryInjectionKey
} from '@/modules/entity-viewer/viewer/workspace/service/EntityViewerTabFactory'
import { type Toaster, toasterInjectionKey } from '@/modules/notification/service/Toaster.ts'
import {
    type MutationHistoryViewerTabFactory,
    mutationHistoryViewerTabFactoryInjectionKey
} from '@/modules/history-viewer/service/MutationHistoryViewerTabFactory.ts'

export class ConnectionExplorerModuleRegistrar implements ModuleRegistrar {

    register(builder: ModuleContextBuilder): void {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)
        const workspaceService: WorkspaceService = builder.inject(workspaceServiceInjectionKey)
        const entityViewerTabFactory: EntityViewerTabFactory = builder.inject(entityViewerTabFactoryInjectionKey)
        const serverViewerTabFactory: ServerViewerTabFactory = builder.inject(serverViewerTabFactoryInjectionKey)
        const taskViewerTabFactory: TaskViewerTabFactory = builder.inject(taskViewerTabFactoryInjectionKey)
        const trafficRecordingsViewerTabFactory: TrafficRecordingsViewerTabFactory = builder.inject(trafficRecordingsViewerTabFactoryInjectionKey)
        const jfrViewerTabFactory: JfrViewerTabFactory = builder.inject(jfrViewerTabFactoryInjectionKey)
        const graphQLConsoleTabFactory: GraphQLConsoleTabFactory = builder.inject(graphQLConsoleTabFactoryInjectionKey)
        const backupViewerTabFactory: BackupViewerTabFactory = builder.inject(backupViewerTabFactoryInjectionKey)
        const evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory = builder.inject(evitaQLConsoleTabFactoryInjectionKey)
        const schemaViewerTabFactory: SchemaViewerTabFactory = builder.inject(schemaViewerTabFactoryInjectionKey)
        const trafficRecordHistoryViewerTabFactory: TrafficRecordHistoryViewerTabFactory = builder.inject(trafficRecordHistoryViewerTabFactoryInjectionKey)
        const mutationHistoryViewerTabFactory: MutationHistoryViewerTabFactory = builder.inject(mutationHistoryViewerTabFactoryInjectionKey)
        const toaster: Toaster = builder.inject(toasterInjectionKey)

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
        const catalogItemMenuFactory: CatalogItemMenuFactory = new CatalogItemMenuFactory(
            workspaceService,
            evitaQLConsoleTabFactory,
            graphQLConsoleTabFactory,
            schemaViewerTabFactory,
            trafficRecordHistoryViewerTabFactory,
            mutationHistoryViewerTabFactory
        )
        const collectionItemMenuFactory: CollectionItemMenuFactory = new CollectionItemMenuFactory(
            workspaceService,
            entityViewerTabFactory,
            schemaViewerTabFactory
        )
        const catalogItemService: CatalogItemService = new CatalogItemService(evitaClient, toaster)
        const collectionItemService: CollectionItemService = new CollectionItemService(evitaClient)

        builder.provide(connectionExplorerServiceInjectionKey, connectionExplorerService)
        builder.provide(connectionExplorerPanelMenuFactoryInjectionKey, connectionExplorerPanelMenuFactory)
        builder.provide(catalogItemMenuFactoryInjectionKey, catalogItemMenuFactory)
        builder.provide(collectionItemMenuFactoryInjectionKey, collectionItemMenuFactory)
        builder.provide(catalogItemServiceInjectionKey, catalogItemService)
        builder.provide(collectionItemServiceInjectionKey, collectionItemService)
    }

}
