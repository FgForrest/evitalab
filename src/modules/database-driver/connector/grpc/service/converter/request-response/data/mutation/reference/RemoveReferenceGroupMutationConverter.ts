import type {
    LocalMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/LocalMutationConverter.ts'
import type {
    GrpcRemoveReferenceGroupMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcReferenceMutations_pb.ts'
import { ReferenceKey } from '@/modules/database-driver/request-response/data/mutation/reference/ReferenceKey.ts'
import {
    RemoveReferenceGroupMutation
} from '@/modules/database-driver/request-response/data/mutation/reference/RemoveReferenceGroupMutation.ts'

export class RemoveReferenceGroupMutationConverter implements LocalMutationConverter<RemoveReferenceGroupMutation, GrpcRemoveReferenceGroupMutation> {
    public static readonly INSTANCE = new RemoveReferenceGroupMutationConverter()

    convert(mutation: GrpcRemoveReferenceGroupMutation): RemoveReferenceGroupMutation {
        return new RemoveReferenceGroupMutation(
            new ReferenceKey(
                mutation.referenceName,
                mutation.referencePrimaryKey
            )
        )
    }
}
