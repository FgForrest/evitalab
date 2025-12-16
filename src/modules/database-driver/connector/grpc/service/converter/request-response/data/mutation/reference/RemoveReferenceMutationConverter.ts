import type {
    GrpcRemoveReferenceMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcReferenceMutations_pb.ts'
import {
    RemoveReferenceMutation
} from '@/modules/database-driver/request-response/data/mutation/reference/RemoveReferenceMutation.ts'
import { ReferenceKey } from '@/modules/database-driver/request-response/data/mutation/reference/ReferenceKey.ts'
import type {
    LocalMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/LocalMutationConverter.ts'

export class RemoveReferenceMutationConverter implements LocalMutationConverter<RemoveReferenceMutation, GrpcRemoveReferenceMutation> {
    public static readonly INSTANCE = new RemoveReferenceMutationConverter()

    convert(mutation: GrpcRemoveReferenceMutation): RemoveReferenceMutation {
        return new RemoveReferenceMutation(
            new ReferenceKey(
                mutation.referenceName,
                mutation.referencePrimaryKey
            )
        )
    }
}
