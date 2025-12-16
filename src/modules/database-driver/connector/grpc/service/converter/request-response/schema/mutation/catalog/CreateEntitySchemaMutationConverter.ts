import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    CreateEntitySchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/catalog/CreateEntitySchemaMutation.ts'
import type {
    GrpcCreateEntitySchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEntitySchemaMutations_pb.ts'

export class CreateEntitySchemaMutationConverter implements SchemaMutationConverter<CreateEntitySchemaMutation, GrpcCreateEntitySchemaMutation> {
    public static readonly INSTANCE = new CreateEntitySchemaMutationConverter()

    convert(mutation: GrpcCreateEntitySchemaMutation): CreateEntitySchemaMutation {
        return new CreateEntitySchemaMutation(mutation.entityType)
    }
}
