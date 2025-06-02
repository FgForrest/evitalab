import { Duration } from 'luxon'
import Immutable from 'immutable'
import { TrafficRecord } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecord'
import { Label } from '@/modules/database-driver/request-response/traffic-recording/Label'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import { TrafficRecordType } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecordType'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'

/**
 * Container for a query and its metadata.
 */
export class QueryContainer extends TrafficRecord {

    /**
     * The shortened description of the query and its purpose
     */
    readonly queryDescription: string
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

    constructor(sessionSequenceOrder: bigint,
                sessionId: Uuid,
                recordSessionOffset: number,
                sessionRecordsCount: number,
                type: TrafficRecordType,
                created: OffsetDateTime,
                duration: Duration,
                ioFetchedSizeBytes: number,
                ioFetchCount: number,
                finishedWithError: string | undefined,
                queryDescription: string,
                query: string,
                totalRecordCount: number,
                primaryKeys: Immutable.List<number>,
                labels: Immutable.List<Label>) {
        super(
            sessionSequenceOrder,
            sessionId,
            recordSessionOffset,
            sessionRecordsCount,
            type,
            created,
            duration,
            ioFetchedSizeBytes,
            ioFetchCount,
            finishedWithError
        )
        this.queryDescription = queryDescription
        this.query = query
        this.totalRecordCount = totalRecordCount
        this.primaryKeys = primaryKeys
        this.labels = labels
    }
}
