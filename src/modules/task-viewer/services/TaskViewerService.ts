import { mandatoryInject } from "@/utils/reactivity";
import type { InjectionKey } from "vue";
import { TaskState } from '@/modules/database-driver/request-response/task/TaskState'
import { PaginatedList } from '@/modules/database-driver/request-response/PaginatedList'
import { TaskStatus } from '@/modules/database-driver/request-response/task/TaskStatus'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'

export const taskViewerServiceInjectionKey: InjectionKey<TaskViewerService> = Symbol('taskViewerService')

export class TaskViewerService {
    private readonly evitaClient: EvitaClient

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
    }

    async getTaskStatuses(pageNumber: number,
                          pageSize: number,
                          states?: TaskState[],
                          taskTypes?: string[]): Promise<PaginatedList<TaskStatus>>{
        return await this.evitaClient.management.listTaskStatuses(
            pageNumber,
            pageSize,
            taskTypes,
            states
        )
    }

    async cancelTask(taskId: Uuid): Promise<boolean> {
        return await this.evitaClient.management.cancelTask(taskId)
    }
}

export function useTaskViewerService(): TaskViewerService {
    return mandatoryInject(taskViewerServiceInjectionKey)
}
