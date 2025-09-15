import type {
    GrpcModifyReferenceSchemaNameMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcReferenceSchemaMutations_pb.ts'
import {
    ModifyReferenceSchemaNameMutation
} from '@/modules/database-driver/request-response/schema/mutation/reference/ModifyReferenceSchemaNameMutation.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'

export class ModifyReferenceSchemaNameMutationConverter implements SchemaMutationConverter<ModifyReferenceSchemaNameMutation, GrpcModifyReferenceSchemaNameMutation> {

    convert(mutation: GrpcModifyReferenceSchemaNameMutation): ModifyReferenceSchemaNameMutation {
        return new ModifyReferenceSchemaNameMutation(
            mutation.name,
            mutation.newName
        )
    }
}
