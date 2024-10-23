import { Connection } from "@/modules/connection/model/Connection";
import { Uuid } from "@/modules/connection/model/data-type/Uuid";
import { mandatoryInject } from "@/utils/reactivity";
import { InjectionKey } from "vue";
import { TaskState } from '@/modules/connection/model/task/TaskState'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { PaginatedList } from '@/modules/connection/model/PaginatedList'
import { TaskStatus } from '@/modules/connection/model/task/TaskStatus'

export const taskViewerServiceInjectionKey: InjectionKey<TaskViewerService> = Symbol('taskViewerService')

export class TaskViewerService {
    private readonly connectionService: ConnectionService

    constructor(connectionService: ConnectionService) {
        this.connectionService = connectionService
    }

    async getTaskStatuses(connection: Connection,
                          pageNumber: number,
                          pageSize: number,
                          states?: TaskState[],
                          taskTypes?: string[]): Promise<PaginatedList<TaskStatus>>{
        const driver = await this.connectionService.getDriver(connection)
        return await driver.getTaskStatuses(connection, pageNumber, pageSize, states, taskTypes)
    }

    async cancelTask(connection: Connection, taskId: Uuid): Promise<boolean> {
        const driver = await this.connectionService.getDriver(connection)
        return await driver.cancelTask(connection, taskId)
    }
}

export function useTaskViewerService(): TaskViewerService {
    return mandatoryInject(taskViewerServiceInjectionKey) as TaskViewerService
}
