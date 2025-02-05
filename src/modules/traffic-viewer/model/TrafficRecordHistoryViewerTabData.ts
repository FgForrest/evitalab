import { TabData } from '@/modules/workspace/tab/model/TabData'
import {
    TrafficRecordHistoryViewerTabDataDto
} from '@/modules/traffic-viewer/model/TrafficRecordHistoryViewerTabDataDto'
import { OffsetDateTime } from '@/modules/connection/model/data-type/OffsetDateTime'
import { Uuid } from '@/modules/connection/model/data-type/Uuid'
import { Label } from '@/modules/connection/model/traffic/Label'
import { UserTrafficRecordType } from '@/modules/traffic-viewer/model/UserTrafficRecordType'

export class TrafficRecordHistoryViewerTabData implements TabData<TrafficRecordHistoryViewerTabDataDto> {

    readonly since?: OffsetDateTime
    readonly types?: UserTrafficRecordType[]
    readonly sessionId?: Uuid
    readonly longerThanInHumanFormat?: string
    readonly fetchingMoreBytesThanInHumanFormat?: string
    readonly labels?: Label[]

    constructor(since?: OffsetDateTime,
                types?: UserTrafficRecordType[],
                sessionId?: Uuid,
                longerThanInHumanFormat?: string,
                fetchingMoreBytesThanInHumanFormat?: string,
                labels?: Label[]) {
        this.since = since
        this.types = types
        this.sessionId = sessionId
        this.longerThanInHumanFormat = longerThanInHumanFormat
        this.fetchingMoreBytesThanInHumanFormat = fetchingMoreBytesThanInHumanFormat
        this.labels = labels
    }

    toSerializable(): TrafficRecordHistoryViewerTabDataDto {
        return {
            since: this.since != undefined
                ? {
                    seconds: String(this.since.timestamp.seconds),
                    nanos: this.since.timestamp.nanos,
                    offset: this.since.offset
                }
                : undefined,
            types: this.types,
            sessionId: this.sessionId?.toString(),
            longerThanMillisecondsInHumanFormat: this.longerThanInHumanFormat,
            fetchingMoreBytesThanInHumanFormat: this.fetchingMoreBytesThanInHumanFormat,
            labels: this.labels
        }
    }
}
