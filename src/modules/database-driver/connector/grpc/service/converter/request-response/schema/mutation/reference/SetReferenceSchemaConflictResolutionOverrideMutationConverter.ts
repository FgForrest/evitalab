import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    SetReferenceSchemaConflictResolutionOverrideMutation
} from '@/modules/database-driver/request-response/schema/mutation/reference/SetReferenceSchemaConflictResolutionOverrideMutation.ts'
import type {
    GrpcSetReferenceSchemaConflictResolutionOverrideMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcReferenceSchemaMutations_pb.ts'
import {
    ConflictResolutionConverter
} from '@/modules/database-driver/connector/grpc/service/converter/ConflictResolutionConverter.ts'

export class SetReferenceSchemaConflictResolutionOverrideMutationConverter implements SchemaMutationConverter<SetReferenceSchemaConflictResolutionOverrideMutation, GrpcSetReferenceSchemaConflictResolutionOverrideMutation> {
    public static readonly INSTANCE = new SetReferenceSchemaConflictResolutionOverrideMutationConverter()

    convert(mutation: GrpcSetReferenceSchemaConflictResolutionOverrideMutation): SetReferenceSchemaConflictResolutionOverrideMutation {
        return new SetReferenceSchemaConflictResolutionOverrideMutation(
            mutation.name,
            ConflictResolutionConverter.convertConflictResolutionOverride(mutation.conflictResolutionOverride)
        )
    }
}
