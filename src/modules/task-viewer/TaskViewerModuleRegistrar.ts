import { ModuleContextBuilder } from "@/ModuleContextBuilder";
import { ModuleRegistrar } from "@/ModuleRegistrar";
import { EvitaDBDriverResolver, evitaDBDriverResolverInjectionKey } from "../connection/driver/EvitaDBDriverResolver";
import { TaskViewerService, taskViewerServiceInjectionKey } from "./services/TaskViewerService";
import { ConnectionService, connectionServiceInjectionKey } from '@/modules/connection/service/ConnectionService'

export class TaskViewerModuleRegistrar implements ModuleRegistrar {
    async register(builder: ModuleContextBuilder): Promise<void> {
        const connectionService: ConnectionService = builder.inject(connectionServiceInjectionKey)
        const taskViewerService: TaskViewerService = new TaskViewerService(connectionService)
        builder.provide(taskViewerServiceInjectionKey, taskViewerService)
    }
}
