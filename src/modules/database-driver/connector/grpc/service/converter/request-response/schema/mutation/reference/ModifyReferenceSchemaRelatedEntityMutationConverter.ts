import type {
    GrpcModifyReferenceSchemaRelatedEntityMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcReferenceSchemaMutations_pb.ts'
import {
    ModifyReferenceSchemaRelatedEntityMutation
} from '@/modules/database-driver/request-response/schema/mutation/reference/ModifyReferenceSchemaRelatedEntityMutation.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'

export class ModifyReferenceSchemaRelatedEntityMutationConverter implements SchemaMutationConverter<ModifyReferenceSchemaRelatedEntityMutation, GrpcModifyReferenceSchemaRelatedEntityMutation> {

    convert(mutation: GrpcModifyReferenceSchemaRelatedEntityMutation): ModifyReferenceSchemaRelatedEntityMutation {
        return new ModifyReferenceSchemaRelatedEntityMutation(
            mutation.name,
            mutation.referencedEntityType,
            mutation.referencedEntityTypeManaged
        )
    }
}
