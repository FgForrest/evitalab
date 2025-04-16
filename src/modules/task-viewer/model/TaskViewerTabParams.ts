import { TabParams } from '@/modules/workspace/tab/model/TabParams'
import { TaskViewerTabParamsDto } from '@/modules/task-viewer/model/TaskViewerTabParamsDto'
import { Connection } from '@/modules/connection/model/Connection'

export class TaskViewerTabParams implements TabParams<TaskViewerTabParamsDto> {

    readonly connection: Connection

    constructor(connection: Connection) {
        this.connection = connection
    }

    toSerializable(): TaskViewerTabParamsDto {
        return {
            connectionId: this.connection.id,
            connectionName: this.connection.name
        }
    }
}
