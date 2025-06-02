import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import { UserTrafficRecordType } from '@/modules/traffic-viewer/model/UserTrafficRecordType'
import { Label } from '@/modules/database-driver/request-response/traffic-recording/Label'

/**
 * Mutable user criteria for history filtering
 */
export class TrafficRecordHistoryCriteria {

    since?: OffsetDateTime
    types?: UserTrafficRecordType[]
    sessionId?: Uuid
    longerThanInHumanFormat?: string
    fetchingMoreBytesThanInHumanFormat?: string
    labels: Label[]

    constructor(since?: OffsetDateTime,
                types?: UserTrafficRecordType[],
                sessionId?: Uuid,
                longerThanInHumanFormat?: string,
                fetchingMoreBytesThanInHumanFormat?: string,
                labels?: Label[]) {
        this.since = since
        this.types = types || Object.values(UserTrafficRecordType).map(type => type as UserTrafficRecordType)
        this.sessionId = sessionId
        this.longerThanInHumanFormat = longerThanInHumanFormat
        this.fetchingMoreBytesThanInHumanFormat = fetchingMoreBytesThanInHumanFormat
        this.labels = labels || []
    }
}
