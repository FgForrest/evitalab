import type { TabParams } from '@/modules/workspace/tab/model/TabParams'
import type { TrafficRecordingsViewerTabParamsDto } from '@/modules/traffic-viewer/model/TrafficRecordingsViewerTabParamsDto'
import { Connection } from '@/modules/connection/model/Connection'

export class TrafficRecordingsViewerTabParams implements TabParams<TrafficRecordingsViewerTabParamsDto> {

    readonly connection: Connection

    constructor(connection: Connection) {
        this.connection = connection
    }

    toSerializable(): TrafficRecordingsViewerTabParamsDto {
        return {
            connectionId: this.connection.id,
            connectionName: this.connection.name
        }
    }
}
