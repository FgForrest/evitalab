import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    ModifyReferenceSchemaRelatedEntityGroupMutation
} from '@/modules/database-driver/request-response/schema/mutation/reference/ModifyReferenceSchemaRelatedEntityGroupMutation.ts'
import type {
    GrpcModifyReferenceSchemaRelatedEntityGroupMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcReferenceSchemaMutations_pb.ts'

export class ModifyReferenceSchemaRelatedEntityGroupMutationConverter implements SchemaMutationConverter<ModifyReferenceSchemaRelatedEntityGroupMutation, GrpcModifyReferenceSchemaRelatedEntityGroupMutation> {

    convert(mutation: GrpcModifyReferenceSchemaRelatedEntityGroupMutation): ModifyReferenceSchemaRelatedEntityGroupMutation {
        return new ModifyReferenceSchemaRelatedEntityGroupMutation(
            mutation.name,
            mutation.referencedGroupType,
            mutation.referencedGroupTypeManaged
        )
    }
}
