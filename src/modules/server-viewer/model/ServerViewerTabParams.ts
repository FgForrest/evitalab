import type { TabParams } from '@/modules/workspace/tab/model/TabParams'
import type { ServerViewerTabParamsDto } from './ServerViewerTabParamsDto'
import { Connection } from '@/modules/connection/model/Connection'

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
