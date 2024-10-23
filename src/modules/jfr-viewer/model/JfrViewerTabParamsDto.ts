import { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import { ConnectionId } from '@/modules/connection/model/ConnectionId'

export interface JfrViewerTabParamsDto extends TabParamsDto {
    readonly connectionId: ConnectionId
}
