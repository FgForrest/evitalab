import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    RemoveCatalogSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/engine/RemoveCatalogSchemaMutation.ts'
import type {
    GrpcRemoveCatalogSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEngineMutation_pb.ts'

export class RemoveCatalogSchemaMutationConverter implements SchemaMutationConverter<RemoveCatalogSchemaMutation, GrpcRemoveCatalogSchemaMutation> {
    public static readonly INSTANCE = new RemoveCatalogSchemaMutationConverter()

    convert(mutation: GrpcRemoveCatalogSchemaMutation): RemoveCatalogSchemaMutation {
        return new RemoveCatalogSchemaMutation(mutation.catalogName)
    }
}
