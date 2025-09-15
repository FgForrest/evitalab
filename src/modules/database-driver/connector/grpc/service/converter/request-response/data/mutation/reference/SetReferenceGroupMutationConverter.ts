import type {
    LocalMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/LocalMutationConverter.ts'
import  {
    SetReferenceGroupMutation
} from '@/modules/database-driver/request-response/data/mutation/reference/SetReferenceGroupMutation.ts'
import type {
    GrpcSetReferenceGroupMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcReferenceMutations_pb.ts'
import { ReferenceKey } from '@/modules/database-driver/request-response/data/mutation/reference/ReferenceKey.ts'

export class SetReferenceGroupMutationConverter implements LocalMutationConverter<SetReferenceGroupMutation, GrpcSetReferenceGroupMutation> {

    convert(mutation: GrpcSetReferenceGroupMutation): SetReferenceGroupMutation {
        return new SetReferenceGroupMutation(
            new ReferenceKey(
                mutation.referenceName,
                mutation.referencePrimaryKey
            ),
            undefined,
            mutation.groupType,
            mutation.groupPrimaryKey
        )
    }
}
