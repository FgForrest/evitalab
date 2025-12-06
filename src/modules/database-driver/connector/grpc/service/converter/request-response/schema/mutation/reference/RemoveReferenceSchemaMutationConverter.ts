import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    RemoveReferenceSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/reference/RemoveReferenceSchemaMutation.ts'
import type {
    GrpcRemoveReferenceSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcReferenceSchemaMutations_pb.ts'

export class RemoveReferenceSchemaMutationConverter implements SchemaMutationConverter<RemoveReferenceSchemaMutation, GrpcRemoveReferenceSchemaMutation> {
    public static readonly INSTANCE = new RemoveReferenceSchemaMutationConverter()

    convert(mutation: GrpcRemoveReferenceSchemaMutation): RemoveReferenceSchemaMutation {
        return new RemoveReferenceSchemaMutation(mutation.name)
    }
}
