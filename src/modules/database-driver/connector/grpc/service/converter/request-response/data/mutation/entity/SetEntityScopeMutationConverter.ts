import type {
    LocalMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/LocalMutationConverter.ts'
import {
    SetEntityScopeMutation
} from '@/modules/database-driver/request-response/data/mutation/scope/SetEntityScopeMutation.ts'
import type { GrpcSetEntityScopeMutation } from '@/modules/database-driver/connector/grpc/gen/GrpcEntityMutations_pb.ts'
import { EntityConverter } from '@/modules/database-driver/connector/grpc/service/converter/EntityConverter.ts'

export class SetEntityScopeMutationConverter implements LocalMutationConverter<SetEntityScopeMutation, GrpcSetEntityScopeMutation> {
    public static readonly INSTANCE = new SetEntityScopeMutationConverter()

    convert(mutation: GrpcSetEntityScopeMutation): SetEntityScopeMutation {
        return new SetEntityScopeMutation(
            EntityConverter.convertEntityScope(mutation.scope)
        )
    }
}
