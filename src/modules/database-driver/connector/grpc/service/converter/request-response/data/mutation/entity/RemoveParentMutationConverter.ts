import type { GrpcRemoveParentMutation } from '@/modules/database-driver/connector/grpc/gen/GrpcEntityMutations_pb.ts'
import {
    RemoveParentMutation
} from '@/modules/database-driver/request-response/data/mutation/parent/RemoveParentMutation.ts'
import type {
    LocalMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/LocalMutationConverter.ts'

export class RemoveParentMutationConverter implements LocalMutationConverter<RemoveParentMutation, GrpcRemoveParentMutation> {
    public static readonly INSTANCE = new RemoveParentMutationConverter()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    convert(_mutation: GrpcRemoveParentMutation): RemoveParentMutation {
        return new RemoveParentMutation()
    }
}
