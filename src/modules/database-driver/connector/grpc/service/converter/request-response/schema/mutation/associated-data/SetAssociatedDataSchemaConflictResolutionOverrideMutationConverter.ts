import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    SetAssociatedDataSchemaConflictResolutionOverrideMutation
} from '@/modules/database-driver/request-response/schema/mutation/associated-data/SetAssociatedDataSchemaConflictResolutionOverrideMutation.ts'
import type {
    GrpcSetAssociatedDataSchemaConflictResolutionOverrideMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAssociatedDataSchemaMutations_pb.ts'
import {
    ConflictResolutionConverter
} from '@/modules/database-driver/connector/grpc/service/converter/ConflictResolutionConverter.ts'

export class SetAssociatedDataSchemaConflictResolutionOverrideMutationConverter implements SchemaMutationConverter<SetAssociatedDataSchemaConflictResolutionOverrideMutation, GrpcSetAssociatedDataSchemaConflictResolutionOverrideMutation> {
    public static readonly INSTANCE = new SetAssociatedDataSchemaConflictResolutionOverrideMutationConverter()

    convert(mutation: GrpcSetAssociatedDataSchemaConflictResolutionOverrideMutation): SetAssociatedDataSchemaConflictResolutionOverrideMutation {
        return new SetAssociatedDataSchemaConflictResolutionOverrideMutation(
            mutation.name,
            ConflictResolutionConverter.convertConflictResolutionOverride(mutation.conflictResolutionOverride)
        )
    }
}
