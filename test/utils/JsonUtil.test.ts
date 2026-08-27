import { describe, expect, test } from 'vitest'
import { create } from '@bufbuild/protobuf'
import { grpcMessageToJson } from '@/utils/JsonUtil'
import {
    GrpcOffsetDateTimeSchema
} from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaDataTypes_pb'
import {
    GrpcQueryResponseSchema
} from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaSessionAPI_pb'

describe('grpcMessageToJson', () => {
    test('a received timestamp is rendered instead of failing on its bigint seconds', () => {
        const message = create(GrpcOffsetDateTimeSchema, {
            timestamp: { seconds: 1_700_000_000n, nanos: 0 },
            offset: '+01:00'
        })

        expect(grpcMessageToJson(GrpcOffsetDateTimeSchema, message)).toEqual({
            timestamp: '2023-11-14T22:13:20Z',
            offset: '+01:00'
        })
        expect(() => JSON.stringify(message)).toThrow(TypeError)
    })

    /**
     * A query result carries prices, whose validity is a pair of timestamps - the shape that used to crash the raw
     * result view of the evitaQL console.
     */
    test('a query response holding a price validity is rendered', () => {
        const response = create(GrpcQueryResponseSchema, {
            recordPage: {
                chunk: {
                    case: 'paginatedList',
                    value: { pageSize: 20, pageNumber: 1 }
                },
                sealedEntities: [{
                    entityType: 'Product',
                    primaryKey: 1,
                    prices: [{
                        priceId: 1,
                        priceList: 'basic',
                        validity: {
                            from: { timestamp: { seconds: 1_700_000_000n, nanos: 0 }, offset: '+01:00' },
                            to: { timestamp: { seconds: 1_800_000_000n, nanos: 0 }, offset: '+01:00' }
                        }
                    }]
                }]
            }
        })

        const json: string = JSON.stringify(grpcMessageToJson(GrpcQueryResponseSchema, response))
        expect(json).toContain('2023-11-14T22:13:20Z')
        expect(json).not.toContain('$typeName')
    })

    /**
     * The canonical form has no representation for a date-time outside the years 0001-9999, so it is rejected there.
     * A single such value must not blank the whole view.
     */
    test('a date-time the canonical form cannot express degrades instead of throwing', () => {
        const message = create(GrpcOffsetDateTimeSchema, {
            timestamp: { seconds: 9_223_372_036_854_775_807n, nanos: 0 },
            offset: 'Z'
        })

        const json = grpcMessageToJson(GrpcOffsetDateTimeSchema, message)
        expect(JSON.stringify(json)).toContain('9223372036854775807')
    })
})
