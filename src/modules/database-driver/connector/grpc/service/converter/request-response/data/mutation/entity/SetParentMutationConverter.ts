import type {
    LocalMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/LocalMutationConverter.ts'
import {
    SetParentMutation
} from '@/modules/database-driver/request-response/data/mutation/parent/SetParentMutation.ts'
import type { GrpcSetParentMutation } from '@/modules/database-driver/connector/grpc/gen/GrpcEntityMutations_pb.ts'

export class SetParentMutationConverter implements LocalMutationConverter<SetParentMutation, GrpcSetParentMutation> {

    convert(mutation: GrpcSetParentMutation): SetParentMutation {
        return new SetParentMutation(mutation.primaryKey)
    }
}
