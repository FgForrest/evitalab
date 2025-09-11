import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    CreateCatalogSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/engine/CreateCatalogSchemaMutation.ts'
import type {
    GrpcCreateCatalogSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEngineMutation_pb.ts'

export class CreateCatalogSchemaMutationConverter implements SchemaMutationConverter<CreateCatalogSchemaMutation, GrpcCreateCatalogSchemaMutation> {

    convert(mutation: GrpcCreateCatalogSchemaMutation): CreateCatalogSchemaMutation {
        return new CreateCatalogSchemaMutation(mutation.catalogName)
    }
}
