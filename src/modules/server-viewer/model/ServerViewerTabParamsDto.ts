import { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'
import { ConnectionId } from '@/modules/connection/model/ConnectionId'

// todo docs
export interface ServerViewerTabParamsDto extends TabDataDto {
    readonly connectionId: ConnectionId
}
