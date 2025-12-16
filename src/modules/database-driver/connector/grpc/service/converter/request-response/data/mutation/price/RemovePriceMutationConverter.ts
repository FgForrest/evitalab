import {
    PriceMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/price/PriceMutationConverter.ts'
import {
    RemovePriceMutation
} from '@/modules/database-driver/request-response/data/mutation/price/RemovePriceMutation.ts'
import type { GrpcRemovePriceMutation } from '@/modules/database-driver/connector/grpc/gen/GrpcPriceMutations_pb.ts'

export class RemovePriceMutationConverter extends PriceMutationConverter<RemovePriceMutation, GrpcRemovePriceMutation> {
    public static readonly INSTANCE = new RemovePriceMutationConverter()

    convert(mutation: GrpcRemovePriceMutation): RemovePriceMutation {
        return new RemovePriceMutation(
            PriceMutationConverter.buildPriceKey(mutation.priceId, mutation.priceList, mutation.currency)
        )
    }
}
