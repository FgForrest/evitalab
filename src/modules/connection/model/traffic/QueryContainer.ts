import { Uuid } from '@/modules/connection/model/data-type/Uuid'
import { OffsetDateTime } from '@/modules/connection/model/data-type/OffsetDateTime'
import { Duration } from 'luxon'
import { TrafficRecord } from '@/modules/connection/model/traffic/TrafficRecord'
import { TrafficRecordType } from '@/modules/connection/model/traffic/TrafficRecordType'
import Immutable from 'immutable'
import { Label } from '@/modules/connection/model/traffic/Label'

/**
 * Container for a query and its metadata.
 */
export class QueryContainer extends TrafficRecord {

    /**
     * The query operation.
     */
    readonly query: string
    /**
     * The total number of records calculated by the query.
     */
    readonly totalRecordCount: number
    /**
     * The primary keys of the records returned by the query (in returned data chunk). I.e. number of records actually
     * returned by the pagination requirement of the query.
     */
    readonly primaryKeys: Immutable.List<number>
    /**
     * The client labels associated with the query.
     */
    readonly labels: Immutable.List<Label>

    constructor(sessionSequenceOrder: bigint | undefined,
                sessionId: Uuid,
                recordSessionOffset: number,
                type: TrafficRecordType,
                created: OffsetDateTime,
                duration: Duration,
                ioFetchedSizeBytes: number,
                ioFetchCount: number,
                query: string,
                totalRecordCount: number,
                primaryKeys: Immutable.List<number>,
                labels: Immutable.List<Label>) {
        super(
            sessionSequenceOrder,
            sessionId,
            recordSessionOffset,
            type,
            created,
            duration,
            ioFetchedSizeBytes,
            ioFetchCount
        )
        this.query = query
        this.totalRecordCount = totalRecordCount
        this.primaryKeys = primaryKeys
        this.labels = labels
    }
}
