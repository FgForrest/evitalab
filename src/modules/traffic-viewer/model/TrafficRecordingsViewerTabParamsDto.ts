import { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import { ConnectionId } from '@/modules/connection/model/ConnectionId'

export interface TrafficRecordingsViewerTabParamsDto extends TabParamsDto {
    readonly connectionId: ConnectionId
}
