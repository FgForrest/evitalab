import {
    PriceMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/price/PriceMutationConverter.ts'
import {
    UpsertPriceMutation
} from '@/modules/database-driver/request-response/data/mutation/price/UpsertPriceMutation.ts'
import type { GrpcUpsertPriceMutation } from '@/modules/database-driver/connector/grpc/gen/GrpcPriceMutations_pb.ts'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'
import { EvitaValueConverter } from '@/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter.ts'

export class UpsertPriceMutationConverter extends PriceMutationConverter<UpsertPriceMutation, GrpcUpsertPriceMutation> {

    convert(mutation: GrpcUpsertPriceMutation): UpsertPriceMutation {
        if (!mutation.priceWithoutTax || !mutation.taxRate || !mutation.priceWithTax) {
            throw new UnexpectedError('Price mutation must have priceWithoutTax, taxRate and priceWithTax.')
        }
        return new UpsertPriceMutation(
            PriceMutationConverter.buildPriceKey(mutation.priceId, mutation.priceList, mutation.currency),
            mutation.innerRecordId || undefined, // todo pfi: how to solve it
            EvitaValueConverter.convertGrpcBigDecimal(mutation.priceWithoutTax),
            EvitaValueConverter.convertGrpcBigDecimal(mutation.taxRate),
            EvitaValueConverter.convertGrpcBigDecimal(mutation.priceWithTax),
            mutation.validity ? EvitaValueConverter.convertGrpcDateTimeRange(mutation.validity) : undefined,
            mutation.indexed || mutation.sellable
        )
    }
}
