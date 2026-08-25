import { expect, test } from 'vitest'
import {
    UpsertPriceMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/price/UpsertPriceMutationConverter'
import type { GrpcUpsertPriceMutation } from '@/modules/database-driver/connector/grpc/gen/GrpcPriceMutations_pb'
import type { GrpcBigDecimal } from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaDataTypes_pb'
import { UpsertPriceMutation } from '@/modules/database-driver/request-response/data/mutation/price/UpsertPriceMutation'

/**
 * `innerRecordId` is nullable in the evitaDB Java model, but `0` is a legal id. The converter used to funnel the gRPC
 * value through `|| undefined`, which silently rewrote a price bound to inner record `0` into an unbound price.
 */

function grpcBigDecimal(value: string): GrpcBigDecimal {
    return { valueString: value } as unknown as GrpcBigDecimal
}

function grpcUpsertPriceMutation(innerRecordId: number | undefined): GrpcUpsertPriceMutation {
    return {
        priceId: 1,
        priceList: 'basic',
        currency: { code: 'CZK' },
        innerRecordId,
        priceWithoutTax: grpcBigDecimal('100'),
        taxRate: grpcBigDecimal('21'),
        priceWithTax: grpcBigDecimal('121'),
        indexed: true,
        sellable: false
    } as unknown as GrpcUpsertPriceMutation
}

test('Should preserve a zero inner record id', () => {
    const converted: UpsertPriceMutation = UpsertPriceMutationConverter.INSTANCE
        .convert(grpcUpsertPriceMutation(0))

    expect(converted.innerRecordId).toBe(0)
})

test('Should keep a non-zero inner record id', () => {
    const converted: UpsertPriceMutation = UpsertPriceMutationConverter.INSTANCE
        .convert(grpcUpsertPriceMutation(42))

    expect(converted.innerRecordId).toBe(42)
})

test('Should keep an unset inner record id undefined', () => {
    const converted: UpsertPriceMutation = UpsertPriceMutationConverter.INSTANCE
        .convert(grpcUpsertPriceMutation(undefined))

    expect(converted.innerRecordId).toBeUndefined()
})
