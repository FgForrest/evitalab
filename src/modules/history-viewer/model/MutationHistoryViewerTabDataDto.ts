import type { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'
import { UserTrafficRecordType } from '@/modules/traffic-viewer/model/UserTrafficRecordType'
import { Label } from '@/modules/database-driver/request-response/traffic-recording/Label'

export interface MutationHistoryViewerTabDataDto extends TabDataDto {

    readonly from?: { seconds: string, nanos: number, offset: string }
    readonly to?: { seconds: string, nanos: number, offset: string }
    readonly types?: UserTrafficRecordType[]
    readonly entityPrimaryKey?: number
}
