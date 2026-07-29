import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    ModifyEntitySchemaConflictResolutionMutation
} from '@/modules/database-driver/request-response/schema/mutation/entity/ModifyEntitySchemaConflictResolutionMutation.ts'
import type {
    GrpcModifyEntitySchemaConflictResolutionMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEntitySchemaMutations_pb.ts'
import {
    ConflictResolutionConverter
} from '@/modules/database-driver/connector/grpc/service/converter/ConflictResolutionConverter.ts'

export class ModifyEntitySchemaConflictResolutionMutationConverter implements SchemaMutationConverter<ModifyEntitySchemaConflictResolutionMutation, GrpcModifyEntitySchemaConflictResolutionMutation> {
    public static readonly INSTANCE = new ModifyEntitySchemaConflictResolutionMutationConverter()

    convert(mutation: GrpcModifyEntitySchemaConflictResolutionMutation): ModifyEntitySchemaConflictResolutionMutation {
        return new ModifyEntitySchemaConflictResolutionMutation(
            ConflictResolutionConverter.convertConflictResolution(mutation.conflictResolution)
        )
    }
}
