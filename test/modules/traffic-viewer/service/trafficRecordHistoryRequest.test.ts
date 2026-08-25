import { describe, expect, test } from 'vitest'
import { createTrafficRecordHistoryRequest } from '@/modules/traffic-viewer/service/trafficRecordHistoryPaging'
import { TrafficRecordHistoryCriteria } from '@/modules/traffic-viewer/model/TrafficRecordHistoryCriteria'
import {
    TrafficRecordingCaptureRequest
} from '@/modules/database-driver/request-response/traffic-recording/TrafficRecordingCaptureRequest'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'

describe('createTrafficRecordHistoryRequest', () => {
    // the criteria session id used to be dropped, so the session filter and the session scoped history
    // tab both showed the traffic of all sessions
    test('carries the session id of the criteria', () => {
        const sessionId: Uuid = Uuid.fromCode('bfd5c4d0-3b3f-4f5b-9f0e-2f34d5f2a333')
        const criteria: TrafficRecordHistoryCriteria = new TrafficRecordHistoryCriteria(
            undefined, undefined, sessionId
        )

        const request: TrafficRecordingCaptureRequest = createTrafficRecordHistoryRequest(criteria)

        expect(request.sessionIds?.toArray()).toEqual([sessionId])
    })

    test('leaves the session ids unset when no session is selected', () => {
        const request: TrafficRecordingCaptureRequest =
            createTrafficRecordHistoryRequest(new TrafficRecordHistoryCriteria())

        expect(request.sessionIds).toBeUndefined()
    })

    test('reads the newest records when no position is passed', () => {
        const request: TrafficRecordingCaptureRequest =
            createTrafficRecordHistoryRequest(new TrafficRecordHistoryCriteria())

        expect(request.sinceSessionSequenceId).toBeUndefined()
        expect(request.sinceRecordSessionOffset).toBeUndefined()
    })

    // a record offset of 0 is not the same as no offset at all - the server would return only the very
    // first record of the session
    test('keeps an unset record offset unset', () => {
        const request: TrafficRecordingCaptureRequest =
            createTrafficRecordHistoryRequest(new TrafficRecordHistoryCriteria(), 7n)

        expect(request.sinceSessionSequenceId).toEqual(7n)
        expect(request.sinceRecordSessionOffset).toBeUndefined()
    })
})
