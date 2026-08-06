import { TrafficRecord } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecord'
import {
    TrafficRecordingCaptureRequest
} from '@/modules/database-driver/request-response/traffic-recording/TrafficRecordingCaptureRequest'
import { TrafficRecordContent } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecordContent'
import { TrafficRecordType } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecordType'
import { TrafficRecordHistoryCriteria } from '@/modules/traffic-viewer/model/TrafficRecordHistoryCriteria'
import { convertUserToSystemRecordType } from '@/modules/traffic-viewer/model/UserTrafficRecordType'
import { parseHumanDurationToMs } from '@/utils/duration'
import { parseHumanByteSizeToNumber } from '@/utils/number'
import { List as ImmutableList } from 'immutable'
import { Duration } from 'luxon'

/**
 * Helpers for reading the traffic record history of a catalog backwards, page by page.
 */

/**
 * Translates the user criteria into the record types the server understands.
 */
export function selectSystemRecordTypes(criteria: TrafficRecordHistoryCriteria): ImmutableList<TrafficRecordType> | undefined {
    if (criteria.types == undefined) {
        return undefined
    }
    return ImmutableList([
        ...(criteria.types.flatMap(userType => convertUserToSystemRecordType(userType)!))
    ])
}

/**
 * Builds the capture request for a single page of the history. Both positional arguments are left unset
 * for a read of the newest records.
 */
export function createTrafficRecordHistoryRequest(criteria: TrafficRecordHistoryCriteria,
                                                  sinceSessionSequenceId?: bigint,
                                                  sinceRecordSessionOffset?: number): TrafficRecordingCaptureRequest {
    return new TrafficRecordingCaptureRequest(
        TrafficRecordContent.Body,
        criteria.since,
        sinceSessionSequenceId,
        sinceRecordSessionOffset,
        selectSystemRecordTypes(criteria),
        criteria.sessionId != undefined
            ? ImmutableList([criteria.sessionId])
            : undefined,
        criteria.longerThanInHumanFormat != undefined
            ? Duration.fromMillis(Number(parseHumanDurationToMs(criteria.longerThanInHumanFormat)))
            : undefined,
        criteria.fetchingMoreBytesThanInHumanFormat != undefined
            ? parseHumanByteSizeToNumber(criteria.fetchingMoreBytesThanInHumanFormat)[0]
            : undefined,
        ImmutableList(criteria.labels)
    )
}

/**
 * Identity of a traffic record within the history of a single catalog.
 */
export function trafficRecordKey(record: TrafficRecord): string {
    return `${record.sessionSequenceOrder}:${record.recordSessionOffset}`
}

/**
 * Prepends an older page of records to the already loaded ones, keeping the result ascending and free of
 * duplicates.
 *
 * The page comes in the order the server returned it — newest record first — and is reversed here. Records
 * already present are dropped, because the visualisation pipeline rejects a session it has already seen and
 * would fail the whole render instead of showing a duplicate row.
 *
 * @param loadedRecords records loaded so far, in ascending order
 * @param olderPage page of older records as returned by a reversed read, newest first
 */
export function prependOlderTrafficRecords(loadedRecords: TrafficRecord[],
                                           olderPage: TrafficRecord[]): TrafficRecord[] {
    const loadedKeys: Set<string> = new Set(loadedRecords.map(record => trafficRecordKey(record)))
    const newRecords: TrafficRecord[] = []
    for (let i = olderPage.length - 1; i >= 0; i--) {
        const record: TrafficRecord = olderPage[i]!
        const key: string = trafficRecordKey(record)
        if (loadedKeys.has(key)) {
            continue
        }
        loadedKeys.add(key)
        newRecords.push(record)
    }
    return [...newRecords, ...loadedRecords]
}
