import { InjectionKey } from 'vue'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { Connection } from '@/modules/connection/model/Connection'
import { TaskViewerTabDefinition } from '@/modules/task-viewer/model/TaskViewerTabDefinition'
import { TaskViewerTabParams } from '@/modules/task-viewer/model/TaskViewerTabParams'
import { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import { TaskViewerTabParamsDto } from '@/modules/task-viewer/model/TaskViewerTabParamsDto'
import { mandatoryInject } from '@/utils/reactivity'
import { i18n } from '@/vue-plugins/i18n'

export const taskViewerTabFactoryInjectionKey: InjectionKey<TaskViewerTabFactory> = Symbol('taskViewerTabFactory')

export class TaskViewerTabFactory {
    private readonly connectionService: ConnectionService

    constructor(connectionService: ConnectionService) {
        this.connectionService = connectionService
    }

    createNew(connection: Connection): TaskViewerTabDefinition {
        return new TaskViewerTabDefinition(
            this.constructTitle(connection),
            new TaskViewerTabParams(connection)
        )
    }

    restoreFromJson(paramsJson: TabParamsDto): TaskViewerTabDefinition {
        const params: TaskViewerTabParams = this.restoreTabParamsFromSerializable(paramsJson)
        return new TaskViewerTabDefinition(
            this.constructTitle(params.connection),
            params
        )
    }

    private constructTitle(connection: Connection): string {
        return i18n.global.t(
            'taskViewer.definition.title',
            { connectionName: connection.name }
        )
    }

    private restoreTabParamsFromSerializable(json: TabParamsDto): TaskViewerTabParams {
        const dto: TaskViewerTabParamsDto = json as TaskViewerTabParamsDto
        return new TaskViewerTabParams(
            this.connectionService.getConnection(dto.connectionId)
        )
    }
}

export const useTaskViewerTabFactory = ():TaskViewerTabFactory => {
    return mandatoryInject(taskViewerTabFactoryInjectionKey) as TaskViewerTabFactory
}
