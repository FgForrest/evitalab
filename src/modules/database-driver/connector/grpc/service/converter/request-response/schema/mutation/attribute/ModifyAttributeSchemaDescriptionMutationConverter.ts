import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    ModifyAttributeSchemaDescriptionMutation
} from '@/modules/database-driver/request-response/schema/mutation/attribute/ModifyAttributeSchemaDescriptionMutation.ts'
import type {
    GrpcModifyAttributeSchemaDescriptionMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAttributeSchemaMutations_pb.ts'

export class ModifyAttributeSchemaDescriptionMutationConverter implements SchemaMutationConverter<ModifyAttributeSchemaDescriptionMutation, GrpcModifyAttributeSchemaDescriptionMutation> {

    convert(mutation: GrpcModifyAttributeSchemaDescriptionMutation): ModifyAttributeSchemaDescriptionMutation {

        return new ModifyAttributeSchemaDescriptionMutation(
            mutation.name,
            mutation.description
        )
    }
}
