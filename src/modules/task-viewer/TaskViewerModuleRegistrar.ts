import { ModuleContextBuilder } from "@/ModuleContextBuilder";
import type { ModuleRegistrar } from "@/ModuleRegistrar";
import { TaskViewerService, taskViewerServiceInjectionKey } from "./services/TaskViewerService";
import { EvitaClient, evitaClientInjectionKey } from '@/modules/database-driver/EvitaClient'

export class TaskViewerModuleRegistrar implements ModuleRegistrar {
    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)
        const taskViewerService: TaskViewerService = new TaskViewerService(evitaClient)
        builder.provide(taskViewerServiceInjectionKey, taskViewerService)
    }
}
