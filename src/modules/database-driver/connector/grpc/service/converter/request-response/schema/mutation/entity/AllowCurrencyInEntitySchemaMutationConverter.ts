import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    AllowCurrencyInEntitySchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/entity/AllowCurrencyInEntitySchemaMutation.ts'
import type {
    GrpcAllowCurrencyInEntitySchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEntitySchemaMutations_pb.ts'
import {
    CatalogSchemaConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogSchemaConverter.ts'
import Immutable from 'immutable'

export class AllowCurrencyInEntitySchemaMutationConverter implements SchemaMutationConverter<AllowCurrencyInEntitySchemaMutation, GrpcAllowCurrencyInEntitySchemaMutation> {

    convert(mutation: GrpcAllowCurrencyInEntitySchemaMutation): AllowCurrencyInEntitySchemaMutation {
        return new AllowCurrencyInEntitySchemaMutation(
            Immutable.List(CatalogSchemaConverter.convertCurrency(mutation.currencies))
        )
    }
}
