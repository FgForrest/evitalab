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
import { List as ImmutableList } from 'immutable'

export class AllowCurrencyInEntitySchemaMutationConverter implements SchemaMutationConverter<AllowCurrencyInEntitySchemaMutation, GrpcAllowCurrencyInEntitySchemaMutation> {
    public static readonly INSTANCE = new AllowCurrencyInEntitySchemaMutationConverter()

    convert(mutation: GrpcAllowCurrencyInEntitySchemaMutation): AllowCurrencyInEntitySchemaMutation {
        return new AllowCurrencyInEntitySchemaMutation(
            ImmutableList(CatalogSchemaConverter.toCurrencyArray(mutation.currencies))
        )
    }
}
