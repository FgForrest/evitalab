import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import type {
    GrpcRestoreCatalogSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEngineMutation_pb.ts'
import {
    RestoreCatalogSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/engine/RestoreCatalogSchemaMutation.ts'

export class RestoreCatalogSchemaMutationConverter implements SchemaMutationConverter<RestoreCatalogSchemaMutation, GrpcRestoreCatalogSchemaMutation> {

    convert(mutation: GrpcRestoreCatalogSchemaMutation): RestoreCatalogSchemaMutation {
        return new RestoreCatalogSchemaMutation(mutation.catalogName)
    }
}
