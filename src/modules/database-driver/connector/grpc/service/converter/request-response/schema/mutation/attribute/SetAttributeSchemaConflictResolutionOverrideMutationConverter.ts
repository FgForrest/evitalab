import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    SetAttributeSchemaConflictResolutionOverrideMutation
} from '@/modules/database-driver/request-response/schema/mutation/attribute/SetAttributeSchemaConflictResolutionOverrideMutation.ts'
import type {
    GrpcSetAttributeSchemaConflictResolutionOverrideMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAttributeSchemaMutations_pb.ts'
import {
    ConflictResolutionConverter
} from '@/modules/database-driver/connector/grpc/service/converter/ConflictResolutionConverter.ts'

export class SetAttributeSchemaConflictResolutionOverrideMutationConverter implements SchemaMutationConverter<SetAttributeSchemaConflictResolutionOverrideMutation, GrpcSetAttributeSchemaConflictResolutionOverrideMutation> {
    public static readonly INSTANCE = new SetAttributeSchemaConflictResolutionOverrideMutationConverter()

    convert(mutation: GrpcSetAttributeSchemaConflictResolutionOverrideMutation): SetAttributeSchemaConflictResolutionOverrideMutation {
        return new SetAttributeSchemaConflictResolutionOverrideMutation(
            mutation.name,
            ConflictResolutionConverter.convertConflictResolutionOverride(mutation.conflictResolutionOverride)
        )
    }
}
