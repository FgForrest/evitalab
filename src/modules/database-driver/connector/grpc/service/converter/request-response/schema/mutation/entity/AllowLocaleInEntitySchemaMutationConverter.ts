import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    DisallowCurrencyInEntitySchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/entity/DisallowCurrencyInEntitySchemaMutation.ts'
import type {
    GrpcDisallowCurrencyInEntitySchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEntitySchemaMutations_pb.ts'
import Immutable from 'immutable'
import {
    CatalogSchemaConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogSchemaConverter.ts'

export class DisallowCurrencyInEntitySchemaMutationConverter implements SchemaMutationConverter<DisallowCurrencyInEntitySchemaMutation, GrpcDisallowCurrencyInEntitySchemaMutation> {

    convert(mutation: GrpcDisallowCurrencyInEntitySchemaMutation): DisallowCurrencyInEntitySchemaMutation {
        return new DisallowCurrencyInEntitySchemaMutation(
            Immutable.Set(CatalogSchemaConverter.convertCurrency(mutation.currencies))
        )
    }
}
