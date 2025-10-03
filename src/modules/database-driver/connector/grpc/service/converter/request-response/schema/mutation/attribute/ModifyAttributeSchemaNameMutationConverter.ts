import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    ModifyAttributeSchemaNameMutation
} from '@/modules/database-driver/request-response/schema/mutation/attribute/ModifyAttributeSchemaNameMutation.ts'
import type {
    GrpcModifyAttributeSchemaNameMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAttributeSchemaMutations_pb.ts'

export class ModifyAttributeSchemaNameMutationConverter implements SchemaMutationConverter<ModifyAttributeSchemaNameMutation, GrpcModifyAttributeSchemaNameMutation> {

    convert(mutation: GrpcModifyAttributeSchemaNameMutation): ModifyAttributeSchemaNameMutation {
        return new ModifyAttributeSchemaNameMutation(
            mutation.name,
            mutation.newName
        )
    }
}
