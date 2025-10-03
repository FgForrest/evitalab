import type { GrpcRemoveParentMutation } from '@/modules/database-driver/connector/grpc/gen/GrpcEntityMutations_pb.ts'
import {
    RemoveParentMutation
} from '@/modules/database-driver/request-response/data/mutation/parent/RemoveParentMutation.ts'
import type {
    LocalMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/LocalMutationConverter.ts'

export class RemoveParentMutationConverter implements LocalMutationConverter<RemoveParentMutation, GrpcRemoveParentMutation> {

    convert(mutation: GrpcRemoveParentMutation): RemoveParentMutation {
        return new RemoveParentMutation()
    }
}
