import { describe, expect, test } from 'vitest'
import { create } from '@bufbuild/protobuf'
import {
    TrafficRecordingConverter
} from '@/modules/database-driver/connector/grpc/service/converter/TrafficRecordingConverter'
import {
    GrpcTrafficRecordingType,
    GrpcTrafficRecordSchema,
    type GrpcTrafficRecord
} from '@/modules/database-driver/connector/grpc/gen/GrpcTrafficRecording_pb'
import {
    MutationContainer
} from '@/modules/database-driver/request-response/traffic-recording/MutationContainer'

/**
 * A mutation of an attribute of the `LongNumberRange` type carries a `google.protobuf.Int64Value`, which the generated
 * code maps to a `bigint`. Stringifying the received message directly therefore threw and took down the whole traffic
 * history page, not just the offending row.
 */
function mutationRecord(): GrpcTrafficRecord {
    return create(GrpcTrafficRecordSchema, {
        sessionSequenceOrder: '1',
        sessionId: { mostSignificantBits: '1', leastSignificantBits: '2' },
        recordSessionOffset: 0,
        sessionRecordsCount: 1,
        type: GrpcTrafficRecordingType.TRAFFIC_RECORDING_MUTATION,
        created: { timestamp: { seconds: 1n, nanos: 0 }, offset: '+01:00' },
        durationInMilliseconds: 1,
        ioFetchedSizeBytes: 0,
        ioFetchCount: 0,
        body: {
            case: 'mutation',
            value: {
                mutation: {
                    case: 'entityMutation',
                    value: {
                        mutation: {
                            case: 'entityUpsertMutation',
                            value: {
                                entityType: 'product',
                                entityPrimaryKey: 1,
                                mutations: [{
                                    mutation: {
                                        case: 'upsertAttributeMutation',
                                        value: {
                                            attributeName: 'validity',
                                            attributeValue: {
                                                value: {
                                                    case: 'longNumberRangeValue',
                                                    value: { from: 10n, to: 20n }
                                                }
                                            }
                                        }
                                    }
                                }]
                            }
                        }
                    }
                }
            }
        }
    })
}

describe('TrafficRecordingConverter mutation body', () => {
    const converter = new TrafficRecordingConverter()

    test('a mutation carrying a 64-bit value can be stringified', () => {
        const record = converter.convertGrpcTrafficRecord(mutationRecord())

        expect(record).toBeInstanceOf(MutationContainer)
        const serialized: string = JSON.stringify((record as MutationContainer).serializedMutation)
        expect(serialized).toContain('"from":"10"')
        expect(serialized).toContain('"to":"20"')
    })

    test('stringifying the received message itself is what used to fail', () => {
        const body = mutationRecord().body
        expect(body.case).toBe('mutation')
        expect(() => JSON.stringify(body.value)).toThrow(TypeError)
    })

    test('no internal protobuf properties leak into the rendered body', () => {
        const record = converter.convertGrpcTrafficRecord(mutationRecord()) as MutationContainer

        const serialized: string = JSON.stringify(record.serializedMutation)
        expect(serialized).not.toContain('$typeName')
        // the oneof is flattened to the name of the selected field, instead of the internal case/value pair
        expect(serialized).not.toContain('"case"')
        expect(record.serializedMutation).toHaveProperty('entityMutation')
    })
})
