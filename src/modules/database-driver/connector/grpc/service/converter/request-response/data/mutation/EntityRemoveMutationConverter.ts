import type { GrpcEntityRemoveMutation } from '@/modules/database-driver/connector/grpc/gen/GrpcEntityMutation_pb.ts'
import type {
    EntityMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/EntityMutationConverter.ts'
import { EntityRemoveMutation } from '@/modules/database-driver/request-response/data/mutation/EntityRemoveMutation.ts'

export class EntityRemoveMutationConverter implements EntityMutationConverter<EntityRemoveMutation, GrpcEntityRemoveMutation> {

    convert(mutation: GrpcEntityRemoveMutation): EntityRemoveMutation {
        return new EntityRemoveMutation(
            mutation.entityType,
            mutation.entityPrimaryKey
        )
    }
}
