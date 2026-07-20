import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import type {
    GrpcDisallowCurrencyInEntitySchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEntitySchemaMutations_pb.ts'
import {
    CatalogSchemaConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogSchemaConverter.ts'
import {
    DisallowCurrencyInEntitySchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/entity/DisallowCurrencyInEntitySchemaMutation.ts'
import { Set as ImmutableSet } from 'immutable'

export class DisallowCurrencyInEntitySchemaMutationConverter implements SchemaMutationConverter<DisallowCurrencyInEntitySchemaMutation, GrpcDisallowCurrencyInEntitySchemaMutation> {
    public static readonly INSTANCE = new DisallowCurrencyInEntitySchemaMutationConverter()

    convert(mutation: GrpcDisallowCurrencyInEntitySchemaMutation): DisallowCurrencyInEntitySchemaMutation {
        return new DisallowCurrencyInEntitySchemaMutation(
            ImmutableSet(CatalogSchemaConverter.toCurrencyArray(mutation.currencies))
        )
    }
}
