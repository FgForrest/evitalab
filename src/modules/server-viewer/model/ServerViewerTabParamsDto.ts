import { Connection } from '@/modules/connection/model/Connection'
import { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'

// todo docs
export interface ServerViewerTabParamsDto extends TabDataDto {
    readonly connection: Connection
}
