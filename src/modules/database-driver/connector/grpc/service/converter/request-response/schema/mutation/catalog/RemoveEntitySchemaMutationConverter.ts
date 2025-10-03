import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    RemoveEntitySchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/catalog/RemoveEntitySchemaMutation.ts'
import type {
    GrpcRemoveEntitySchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEntitySchemaMutations_pb.ts'

export class RemoveEntitySchemaMutationConverter implements SchemaMutationConverter<RemoveEntitySchemaMutation, GrpcRemoveEntitySchemaMutation> {

    convert(mutation: GrpcRemoveEntitySchemaMutation): RemoveEntitySchemaMutation {
        return new RemoveEntitySchemaMutation(mutation.name)
    }
}
