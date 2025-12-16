import type {
    GrpcModifyReferenceSchemaDescriptionMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcReferenceSchemaMutations_pb.ts'
import {
    ModifyReferenceSchemaDescriptionMutation
} from '@/modules/database-driver/request-response/schema/mutation/reference/ModifyReferenceSchemaDescriptionMutation.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'

export class ModifyReferenceSchemaDescriptionMutationConverter implements SchemaMutationConverter<ModifyReferenceSchemaDescriptionMutation, GrpcModifyReferenceSchemaDescriptionMutation> {
    public static readonly INSTANCE = new ModifyReferenceSchemaDescriptionMutationConverter()

    convert(mutation: GrpcModifyReferenceSchemaDescriptionMutation): ModifyReferenceSchemaDescriptionMutation {
        return new ModifyReferenceSchemaDescriptionMutation(
            mutation.name,
            mutation.description
        )
    }
}
