import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import type {
    GrpcDisallowLocaleInEntitySchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEntitySchemaMutations_pb.ts'
import {
    CatalogSchemaConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogSchemaConverter.ts'
import {
    DisallowLocaleInEntitySchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/entity/DisallowLocaleInEntitySchemaMutation.ts'
import Immutable from 'immutable'

export class DisallowLocaleInEntitySchemaMutationConverter implements SchemaMutationConverter<DisallowLocaleInEntitySchemaMutation, GrpcDisallowLocaleInEntitySchemaMutation> {

    convert(mutation: GrpcDisallowLocaleInEntitySchemaMutation): DisallowLocaleInEntitySchemaMutation {
        return new DisallowLocaleInEntitySchemaMutation(
            Immutable.Set(CatalogSchemaConverter.convertLocales(mutation.locales))
        )
    }
}
