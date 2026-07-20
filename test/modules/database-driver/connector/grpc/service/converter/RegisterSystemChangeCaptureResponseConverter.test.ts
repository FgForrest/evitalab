// DelegatingEntitySchemaMutationConverter and ModifyEntitySchemaMutationConverter form a pre-existing
// circular dependency that only initializes cleanly when the delegating converter loads first — as it
// does at app runtime via MutationHistoryConverter. Import it first to reproduce that load order.
import '../../../../../../../src/modules/database-driver/connector/grpc/service/converter/MutationHistoryConverter'
import { describe, test, expect } from 'vitest'
import {
    RegisterSystemChangeCaptureResponseConverter
} from '../../../../../../../src/modules/database-driver/connector/grpc/service/converter/RegisterSystemChangeCaptureResponseConverter'
import {
    ChangeSystemCaptureConverter
} from '../../../../../../../src/modules/database-driver/connector/grpc/service/converter/ChangeSystemCaptureConverter'
import {
    GrpcCaptureResponseType,
    GrpcChangeCaptureOperation
} from '../../../../../../../src/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb'
import type {
    GrpcRegisterSystemChangeCaptureResponse
} from '../../../../../../../src/modules/database-driver/connector/grpc/gen/GrpcEvitaAPI_pb'
import { CaptureResponseType } from '../../../../../../../src/modules/database-driver/request-response/cdc/CaptureResponseType'

function response(overrides: Partial<GrpcRegisterSystemChangeCaptureResponse>): GrpcRegisterSystemChangeCaptureResponse {
    return {
        uuid: undefined,
        capture: undefined,
        responseType: GrpcCaptureResponseType.ACKNOWLEDGEMENT,
        heartBeat: undefined,
        ...overrides
    } as GrpcRegisterSystemChangeCaptureResponse
}

describe('RegisterSystemChangeCaptureResponseConverter', () => {
    const converter = new RegisterSystemChangeCaptureResponseConverter(new ChangeSystemCaptureConverter())

    test('maps the acknowledgement response type, uuid and heartbeat', () => {
        const result = converter.convert(response({
            responseType: GrpcCaptureResponseType.ACKNOWLEDGEMENT,
            uuid: { mostSignificantBits: '1', leastSignificantBits: '2' } as GrpcRegisterSystemChangeCaptureResponse['uuid'],
            heartBeat: {
                index: '5',
                timestamp: undefined,
                lastObservedVersion: '99',
                millisToNextHeartbeat: '1000'
            } as GrpcRegisterSystemChangeCaptureResponse['heartBeat']
        }))

        expect(result.responseType).toBe(CaptureResponseType.Acknowledgement)
        expect(result.uuid).toBeDefined()
        expect(result.heartBeat).toBeDefined()
        expect(result.heartBeat!.index).toBe(5)
        expect(result.heartBeat!.lastObservedVersion).toBe(99)
        expect(result.heartBeat!.millisToNextHeartbeat).toBe(1000)
    })

    test('maps the heartbeat response type', () => {
        const result = converter.convert(response({ responseType: GrpcCaptureResponseType.HEARTBEAT }))
        expect(result.responseType).toBe(CaptureResponseType.Heartbeat)
    })

    test('maps a change response and delegates the capture conversion', () => {
        const result = converter.convert(response({
            responseType: GrpcCaptureResponseType.CHANGE,
            capture: {
                version: '7',
                index: 0,
                operation: GrpcChangeCaptureOperation.UPSERT,
                body: { case: undefined },
                timestamp: undefined
            } as unknown as GrpcRegisterSystemChangeCaptureResponse['capture']
        }))

        expect(result.responseType).toBe(CaptureResponseType.Change)
        expect(result.capture).toBeDefined()
        expect(result.capture!.version).toBe(7)
    })

    test('leaves uuid, capture and heartbeat undefined when absent', () => {
        const result = converter.convert(response({}))
        expect(result.uuid).toBeUndefined()
        expect(result.capture).toBeUndefined()
        expect(result.heartBeat).toBeUndefined()
    })
})
