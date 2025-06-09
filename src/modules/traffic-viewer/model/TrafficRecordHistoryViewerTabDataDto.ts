import type { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'
import { UserTrafficRecordType } from '@/modules/traffic-viewer/model/UserTrafficRecordType'
import { Label } from '@/modules/database-driver/request-response/traffic-recording/Label'

export interface TrafficRecordHistoryViewerTabDataDto extends TabDataDto {

    readonly since?: { seconds: string, nanos: number, offset: string }
    readonly types?: UserTrafficRecordType[]
    readonly sessionId?: string
    readonly longerThanMillisecondsInHumanFormat?: string
    readonly fetchingMoreBytesThanInHumanFormat?: string
    readonly labels?: Label[]
}
