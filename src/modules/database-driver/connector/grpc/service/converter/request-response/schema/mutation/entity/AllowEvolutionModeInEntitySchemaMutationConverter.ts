import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    AllowLocaleInEntitySchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/entity/AllowLocaleInEntitySchemaMutation.ts'
import type {
    GrpcAllowLocaleInEntitySchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEntitySchemaMutations_pb.ts'
import {
    CatalogSchemaConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogSchemaConverter.ts'
import Immutable from 'immutable'

export class AllowLocaleInEntitySchemaMutationConverter implements SchemaMutationConverter<AllowLocaleInEntitySchemaMutation, GrpcAllowLocaleInEntitySchemaMutation> {

    convert(mutation: GrpcAllowLocaleInEntitySchemaMutation): AllowLocaleInEntitySchemaMutation {
        return new AllowLocaleInEntitySchemaMutation(
            Immutable.List(CatalogSchemaConverter.convertLocales(mutation.locales))
        )
    }
}
