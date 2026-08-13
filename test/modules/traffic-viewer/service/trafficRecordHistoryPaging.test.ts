import { describe, expect, test } from 'vitest'
import { prependOlderTrafficRecords } from '@/modules/traffic-viewer/service/trafficRecordHistoryPaging'
import { TrafficRecord } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecord'
import { TrafficRecordType } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecordType'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import { Duration } from 'luxon'

class TestTrafficRecord extends TrafficRecord {
    constructor(sessionSequenceOrder: bigint, recordSessionOffset: number) {
        super(
            sessionSequenceOrder,
            Uuid.fromBits(BigInt(sessionSequenceOrder), 1n),
            recordSessionOffset,
            10,
            TrafficRecordType.Query,
            OffsetDateTime.of(0n, 0, '+00:00'),
            Duration.fromMillis(0),
            0,
            0,
            undefined
        )
    }
}

/**
 * Page as returned by a reversed read - newest record first.
 */
function page(...records: [bigint, number][]): TrafficRecord[] {
    return records.map(([sequenceOrder, offset]) => new TestTrafficRecord(sequenceOrder, offset))
}

function keys(records: TrafficRecord[]): string[] {
    return records.map(record => `${record.sessionSequenceOrder}:${record.recordSessionOffset}`)
}

describe('prependOlderTrafficRecords', () => {
    test('turns the first reversed page into an ascending record list', () => {
        const result: TrafficRecord[] = prependOlderTrafficRecords([], page([2n, 1], [2n, 0], [1n, 1]))

        expect(keys(result)).toEqual(['1:1', '2:0', '2:1'])
    })

    test('prepends an older page before the already loaded records', () => {
        const loaded: TrafficRecord[] = prependOlderTrafficRecords([], page([3n, 1], [3n, 0]))

        const result: TrafficRecord[] = prependOlderTrafficRecords(loaded, page([2n, 1], [2n, 0]))

        expect(keys(result)).toEqual(['2:0', '2:1', '3:0', '3:1'])
    })

    // a re-fetched record would make the visualisation pipeline reject the whole render, not render
    // a duplicate row, so the overlap has to be dropped here
    test('drops records already loaded', () => {
        const loaded: TrafficRecord[] = prependOlderTrafficRecords([], page([3n, 1], [3n, 0], [2n, 1]))

        const result: TrafficRecord[] = prependOlderTrafficRecords(loaded, page([2n, 1], [2n, 0], [1n, 0]))

        expect(keys(result)).toEqual(['1:0', '2:0', '2:1', '3:0', '3:1'])
    })

    test('drops duplicates within a single page', () => {
        const result: TrafficRecord[] = prependOlderTrafficRecords([], page([1n, 0], [1n, 0]))

        expect(keys(result)).toEqual(['1:0'])
    })
})
