import { expect, test } from 'vitest'
import {
    SetPriceInnerRecordHandlingMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/price/SetPriceInnerRecordHandlingMutationConverter'
import type {
    GrpcSetPriceInnerRecordHandlingMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcPriceMutations_pb'
import { GrpcPriceInnerRecordHandling } from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb'
import { PriceInnerRecordHandling } from '@/modules/database-driver/data-type/PriceInnerRecordHandling'

/**
 * The converter used to reject `UNKNOWN`, mistaking it for protobuf's `UNRECOGNIZED` sentinel of the Java
 * implementation. `UNKNOWN` is a legal domain value meaning the handling was not fetched along with the entity, while
 * an enum number outside the generated enum is what must be rejected.
 */

function grpcMutation(priceInnerRecordHandling: number): GrpcSetPriceInnerRecordHandlingMutation {
    return { priceInnerRecordHandling } as unknown as GrpcSetPriceInnerRecordHandlingMutation
}

test('Should accept the unknown price inner record handling', () => {
    const converted = SetPriceInnerRecordHandlingMutationConverter.INSTANCE
        .convert(grpcMutation(GrpcPriceInnerRecordHandling.UNKNOWN))

    expect(converted.priceInnerRecordHandling).toBe(PriceInnerRecordHandling.Unknown)
})

test('Should accept every regular price inner record handling', () => {
    expect(
        SetPriceInnerRecordHandlingMutationConverter.INSTANCE
            .convert(grpcMutation(GrpcPriceInnerRecordHandling.SUM))
            .priceInnerRecordHandling
    ).toBe(PriceInnerRecordHandling.Sum)
    expect(
        SetPriceInnerRecordHandlingMutationConverter.INSTANCE
            .convert(grpcMutation(GrpcPriceInnerRecordHandling.LOWEST_PRICE))
            .priceInnerRecordHandling
    ).toBe(PriceInnerRecordHandling.LowestPrice)
    expect(
        SetPriceInnerRecordHandlingMutationConverter.INSTANCE
            .convert(grpcMutation(GrpcPriceInnerRecordHandling.NONE))
            .priceInnerRecordHandling
    ).toBe(PriceInnerRecordHandling.None)
})

test('Should reject an enum number this schema version does not know', () => {
    expect(() => SetPriceInnerRecordHandlingMutationConverter.INSTANCE.convert(grpcMutation(-1)))
        .toThrow(/Unrecognized price inner record handling/)
})
