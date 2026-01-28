import { ModuleContextBuilder } from "@/ModuleContextBuilder";
import type { ModuleRegistrar } from "@/ModuleRegistrar";
import { TaskViewerService, taskViewerServiceInjectionKey } from "./services/TaskViewerService";
import { EvitaClient, evitaClientInjectionKey } from '@/modules/database-driver/EvitaClient'

export class TaskViewerModuleRegistrar implements ModuleRegistrar {
    register(builder: ModuleContextBuilder): void {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)
        const taskViewerService: TaskViewerService = new TaskViewerService(evitaClient)
        builder.provide(taskViewerServiceInjectionKey, taskViewerService)
    }
}
