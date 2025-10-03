import type { PriceMutation } from '@/modules/database-driver/request-response/data/mutation/price/PriceMutation.ts'
import type {
    LocalMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/LocalMutationConverter.ts'
import type { GrpcCurrency } from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaDataTypes_pb.ts'
import { PriceKey } from '@/modules/database-driver/request-response/data/mutation/price/PriceKey.ts'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'
import {
    CatalogSchemaConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogSchemaConverter.ts'
import type { Message } from '@bufbuild/protobuf'

export abstract class PriceMutationConverter<J extends PriceMutation, G extends Message> implements LocalMutationConverter<J, G> {

    protected static buildPriceKey(priceId: number, priceList: string, currency: GrpcCurrency | undefined): PriceKey {
        if (!currency?.code) {
            throw new UnexpectedError('Currency is required!')
        }
        return new PriceKey(
            priceId,
            priceList,
            CatalogSchemaConverter.toCurrency(currency)
        )
    }

    abstract convert(mutation: G): J
}
