import { List as ImmutableList } from 'immutable'
import { Duration } from 'luxon'
import { TrafficRecordContent } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecordContent'
import { TrafficRecordType } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecordType'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import { Label } from '@/modules/database-driver/request-response/traffic-recording/Label'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'

/**
 * Defines criteria by which traffic recording history will be filtered and fetched.
 */
export class TrafficRecordingCaptureRequest {

    readonly content: TrafficRecordContent
    readonly since?: OffsetDateTime
    readonly sinceSessionSequenceId?: bigint
    readonly sinceRecordSessionOffset?: number
    readonly types?: ImmutableList<TrafficRecordType>
    readonly sessionIds?: ImmutableList<Uuid>
    readonly longerThan?: Duration
    readonly fetchingMoreBytesThan?: number
    readonly labels?: ImmutableList<Label>

    constructor(content: TrafficRecordContent,
                since: OffsetDateTime | undefined,
                sinceSessionSequenceId: bigint | undefined,
                sinceRecordSessionOffset: number | undefined,
                types: ImmutableList<TrafficRecordType> | undefined,
                sessionIds: ImmutableList<Uuid> | undefined,
                longerThan: Duration | undefined,
                fetchingMoreBytesThan: number | undefined,
                labels: ImmutableList<Label> | undefined) {
        this.content = content
        this.since = since
        this.sinceSessionSequenceId = sinceSessionSequenceId
        this.sinceRecordSessionOffset = sinceRecordSessionOffset
        this.types = types
        this.sessionIds = sessionIds
        this.longerThan = longerThan
        this.fetchingMoreBytesThan = fetchingMoreBytesThan
        this.labels = labels
    }
}
