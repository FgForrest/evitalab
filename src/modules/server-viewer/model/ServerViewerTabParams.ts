import { TabParams } from '@/modules/workspace/tab/model/TabParams'
import { ServerViewerTabParamsDto } from './ServerViewerTabParamsDto'
import { ExecutableTabRequest } from '@/modules/workspace/tab/model/ExecutableTabRequest'
import { Connection } from '@/modules/connection/model/Connection'

// todo docs
export class ServerViewerTabParams implements TabParams<ServerViewerTabParamsDto> {

    readonly connection: Connection

    constructor(connection: Connection) {
        this.connection = connection
    }

    toSerializable(): ServerViewerTabParamsDto {
        return {
            connectionId: this.connection.id,
            connectionName: this.connection.name
        }
    }

}
