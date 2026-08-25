import { ModuleContextBuilder } from "@/ModuleContextBuilder";
import type { ModuleRegistrar } from "@/ModuleRegistrar";
import { TaskViewerService, taskViewerServiceInjectionKey } from "./services/TaskViewerService";
import { EvitaClient, evitaClientInjectionKey } from '@/modules/database-driver/EvitaClient'
import { ConnectionService, connectionServiceInjectionKey } from '@/modules/connection/service/ConnectionService'
import {
    TabFactoryRegistry,
    tabFactoryRegistryInjectionKey
} from '@/modules/workspace/tab/service/TabFactoryRegistry'
import {
    TaskViewerTabFactory,
    taskViewerTabFactoryInjectionKey
} from '@/modules/task-viewer/services/TaskViewerTabFactory'

export class TaskViewerModuleRegistrar implements ModuleRegistrar {
    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)
        const connectionService: ConnectionService = builder.inject(connectionServiceInjectionKey)
        const tabFactoryRegistry: TabFactoryRegistry = builder.inject(tabFactoryRegistryInjectionKey)

        const taskViewerTabFactory: TaskViewerTabFactory = new TaskViewerTabFactory(connectionService)
        builder.provide(taskViewerTabFactoryInjectionKey, taskViewerTabFactory)
        tabFactoryRegistry.register(taskViewerTabFactory)

        const taskViewerService: TaskViewerService = new TaskViewerService(evitaClient)
        builder.provide(taskViewerServiceInjectionKey, taskViewerService)
    }
}
