import { TabParams } from '@/modules/workspace/tab/model/TabParams'
import { ServerViewerTabParamsDto } from './ServerViewerTabParamsDto'
import { ExecutableTabRequest } from '@/modules/workspace/tab/model/ExecutableTabRequest'
import { Connection } from '@/modules/connection/model/Connection'

// todo docs
export class ServerViewerTabParams implements TabParams<ServerViewerTabParamsDto>, ExecutableTabRequest {
    readonly executeOnOpen: boolean
    readonly connection: Connection

    constructor(connection: Connection, executeOnOpen: boolean = false) {
        this.connection = connection
        this.executeOnOpen = executeOnOpen
    }

    toSerializable(): ServerViewerTabParamsDto {
        return {
            connection: this.connection
        }
    }

}
