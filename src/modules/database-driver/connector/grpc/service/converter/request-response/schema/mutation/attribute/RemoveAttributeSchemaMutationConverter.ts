import type {
    GrpcRemoveAttributeSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAttributeSchemaMutations_pb.ts'
import {
    RemoveAttributeSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/attribute/RemoveAttributeSchemaMutation.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'

export class RemoveAttributeSchemaMutationConverter implements SchemaMutationConverter<RemoveAttributeSchemaMutation, GrpcRemoveAttributeSchemaMutation> {
    public static readonly INSTANCE = new RemoveAttributeSchemaMutationConverter()

    convert(mutation: GrpcRemoveAttributeSchemaMutation): RemoveAttributeSchemaMutation {
        return new RemoveAttributeSchemaMutation(mutation.name)
    }
}
