import type { GrpcEntityUpsertMutation } from '@/modules/database-driver/connector/grpc/gen/GrpcEntityMutation_pb.ts'
import {
    DelegatingLocalMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/DelegatingLocalMutationConverter.ts'
import {
    CatalogSchemaConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogSchemaConverter.ts'
import { EntityUpsertMutation } from '@/modules/database-driver/request-response/data/mutation/EntityUpsertMutation.ts'
import { List as ImmutableList } from 'immutable'
import type {
    EntityMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/EntityMutationConverter.ts'

export class EntityUpsertMutationConverter implements EntityMutationConverter<EntityUpsertMutation, GrpcEntityUpsertMutation> {
    public static readonly INSTANCE = new EntityUpsertMutationConverter()

    convert(mutation: GrpcEntityUpsertMutation): EntityUpsertMutation {
        return new EntityUpsertMutation(
            Number(mutation.entityPrimaryKey),
            mutation.entityType,
            CatalogSchemaConverter.toEntityExistence(mutation.entityExistence),
            ImmutableList(mutation.mutations.map(m => DelegatingLocalMutationConverter.convert(m)))
        )
    }
}
