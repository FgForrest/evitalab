import { TabParams } from '@/modules/workspace/tab/model/TabParams'
import {
    TrafficRecordHistoryViewerTabParamsDto
} from '@/modules/traffic-viewer/model/TrafficRecordHistoryViewerTabParamsDto'
import { TrafficRecordHistoryDataPointer } from '@/modules/traffic-viewer/model/TrafficRecordHistoryDataPointer'

export class TrafficRecordHistoryViewerTabParams implements TabParams<TrafficRecordHistoryViewerTabParamsDto> {

    readonly dataPointer: TrafficRecordHistoryDataPointer

    constructor(dataPointer: TrafficRecordHistoryDataPointer) {
        this.dataPointer = dataPointer
    }

    toSerializable(): TrafficRecordHistoryViewerTabParamsDto {
        return {
            connectionId: this.dataPointer.connection.id,
            catalogName: this.dataPointer.catalogName,
        }
    }
}
