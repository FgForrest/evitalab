import { OffsetDateTime } from '@/modules/connection/model/data-type/OffsetDateTime'
import { Uuid } from '@/modules/connection/model/data-type/Uuid'
import { Label } from '@/modules/connection/model/traffic/Label'
import { UserTrafficRecordType } from '@/modules/traffic-viewer/model/UserTrafficRecordType'

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
