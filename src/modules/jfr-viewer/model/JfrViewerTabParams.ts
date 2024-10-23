import { TabParams } from '@/modules/workspace/tab/model/TabParams'
import { JfrViewerTabParamsDto } from '@/modules/jfr-viewer/model/JfrViewerTabParamsDto'
import { Connection } from '@/modules/connection/model/Connection'

export class JfrViewerTabParams implements TabParams<JfrViewerTabParamsDto> {

    readonly connection: Connection

    constructor(connection: Connection) {
        this.connection = connection
    }

    toSerializable(): JfrViewerTabParamsDto {
        return {
            connectionId: this.connection.id,
        }
    }
}
