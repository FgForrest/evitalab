// todo docs
import { ModuleRegistrar } from '@/ModuleRegistrar'
import { DemoSnippetResolver, demoSnippetResolverInjectionKey } from '@/modules/workspace/service/DemoSnippetResolver'
import { ConnectionService, connectionServiceInjectionKey } from '@/modules/connection/service/ConnectionService'
import {
    EvitaQLConsoleTabFactory,
    evitaQLConsoleTabFactoryInjectionKey
} from '@/modules/evitaql-console/console/workspace/service/EvitaQLConsoleTabFactory'
import {
    GraphQLConsoleTabFactory,
    graphQLConsoleTabFactoryInjectionKey
} from '@/modules/graphql-console/console/workspace/service/GraphQLConsoleTabFactory'
import { WorkspaceService, workspaceServiceInjectionKey } from '@/modules/workspace/service/WorkspaceService'
import {
    EntityViewerTabFactory,
    entityViewerTabFactoryInjectionKey
} from '@/modules/entity-viewer/viewer/workspace/service/EntityViewerTabFactory'
import {
    SchemaViewerTabFactory,
    schemaViewerTabFactoryInjectionKey
} from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import {
    KeymapViewerTabFactory,
    keymapViewerTabFactoryInjectionKey
} from '@/modules/keymap/viewer/workspace/service/KeymapViewerTabFactory'
import { useWorkspaceStore, WorkspaceStore } from '@/modules/workspace/store/workspaceStore'
import { LabStorage, labStorageInjectionKey } from '@/modules/storage/LabStorage'
import { SharedTabResolver, sharedTabResolverInjectionKey } from '@/modules/workspace/tab/service/SharedTabResolver'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import {
    ServerViewerTabFactory,
    serverViewerTabFactoryInjectionKey
} from '@/modules/server-viewer/service/ServerViewerTabFactory'
import { BackupViewerTabFactory, backupsTabFactoryInjectionKey } from '@/modules/backup-viewer/service/BackupViewerTabFactory'
import { TaskViewerTabFactory, taskViewerTabFactoryInjectionKey } from '@/modules/task-viewer/services/TaskViewerTabFactory'
import { JfrViewerTabFactory, jfrViewerTabFactoryInjectionKey } from '@/modules/jfr-viewer/service/JfrViewerTabFactory'

export class WorkspaceModuleRegistrar implements ModuleRegistrar {

    register(builder: ModuleContextBuilder): void {
        const workspaceStore: WorkspaceStore = useWorkspaceStore()

        const labStorage: LabStorage = builder.inject(labStorageInjectionKey)
        const connectionService: ConnectionService = builder.inject(connectionServiceInjectionKey)

        // todo lho fix circular dep
        const entityViewerTabFactory: EntityViewerTabFactory = new EntityViewerTabFactory(connectionService)
        builder.provide(entityViewerTabFactoryInjectionKey, entityViewerTabFactory)
        const evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory = new EvitaQLConsoleTabFactory(connectionService)
        builder.provide(evitaQLConsoleTabFactoryInjectionKey, evitaQLConsoleTabFactory)
        const graphQLConsoleTabFactory: GraphQLConsoleTabFactory = new GraphQLConsoleTabFactory(connectionService)
        builder.provide(graphQLConsoleTabFactoryInjectionKey, graphQLConsoleTabFactory)
        const schemaViewerTabFactory: SchemaViewerTabFactory = new SchemaViewerTabFactory(connectionService)
        builder.provide(schemaViewerTabFactoryInjectionKey, schemaViewerTabFactory)
        const keymapViewerTabFactory: KeymapViewerTabFactory = new KeymapViewerTabFactory()
        builder.provide(keymapViewerTabFactoryInjectionKey, keymapViewerTabFactory)
        const serverViewerTabFactory: ServerViewerTabFactory = new ServerViewerTabFactory(connectionService)
        builder.provide(serverViewerTabFactoryInjectionKey, serverViewerTabFactory)
        const taskViewerTabFactory: TaskViewerTabFactory = new TaskViewerTabFactory(connectionService)
        builder.provide(taskViewerTabFactoryInjectionKey, taskViewerTabFactory)
        const jfrViewerTabFactory: JfrViewerTabFactory = new JfrViewerTabFactory(connectionService)
        builder.provide(jfrViewerTabFactoryInjectionKey, jfrViewerTabFactory)
        const backupViewerTabFactory: BackupViewerTabFactory = new BackupViewerTabFactory(connectionService)
        builder.provide(backupsTabFactoryInjectionKey, backupViewerTabFactory)
        // todo lho fix circular dep
        // const entityViewerTabFactory: EntityViewerTabFactory = builder.inject(entityViewerTabFactoryInjectionKey)
        // const evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory = builder.inject(evitaQLConsoleTabFactoryInjectionKey)
        // const graphQLConsoleTabFactory: GraphQLConsoleTabFactory = builder.inject(graphQLConsoleTabFactoryInjectionKey)
        // const schemaViewerTabFactory: SchemaViewerTabFactory = builder.inject(schemaViewerTabFactoryInjectionKey)
        // const keymapViewerTabFactory: KeymapViewerTabFactory = builder.inject(keymapViewerTabFactoryInjectionKey)

        builder.provide(
            workspaceServiceInjectionKey,
            new WorkspaceService(
                workspaceStore,
                labStorage,
                entityViewerTabFactory,
                evitaQLConsoleTabFactory,
                graphQLConsoleTabFactory,
                schemaViewerTabFactory,
                keymapViewerTabFactory,
                serverViewerTabFactory,
                taskViewerTabFactory,
                backupViewerTabFactory,
                jfrViewerTabFactory
            )
        )
        builder.provide(
            demoSnippetResolverInjectionKey,
            new DemoSnippetResolver(
                connectionService,
                evitaQLConsoleTabFactory,
                graphQLConsoleTabFactory
            )
        )
        builder.provide(
            sharedTabResolverInjectionKey,
            new SharedTabResolver(
                entityViewerTabFactory,
                evitaQLConsoleTabFactory,
                graphQLConsoleTabFactory,
                schemaViewerTabFactory
            )
        )
    }
}
