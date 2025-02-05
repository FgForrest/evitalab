import { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'
import { Label } from '@/modules/connection/model/traffic/Label'
import { UserTrafficRecordType } from '@/modules/traffic-viewer/model/UserTrafficRecordType'

export interface TrafficRecordHistoryViewerTabDataDto extends TabDataDto {

    readonly since?: { seconds: string, nanos: number, offset: string }
    readonly types?: UserTrafficRecordType[]
    readonly sessionId?: string
    readonly longerThanMillisecondsInHumanFormat?: string
    readonly fetchingMoreBytesThanInHumanFormat?: string
    readonly labels?: Label[]
}
