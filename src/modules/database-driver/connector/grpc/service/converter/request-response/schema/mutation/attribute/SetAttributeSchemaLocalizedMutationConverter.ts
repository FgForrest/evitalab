import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    SetAttributeSchemaLocalizedMutation
} from '@/modules/database-driver/request-response/schema/mutation/attribute/SetAttributeSchemaLocalizedMutation.ts'
import type {
    GrpcSetAttributeSchemaLocalizedMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAttributeSchemaMutations_pb.ts'

export class SetAttributeSchemaLocalizedMutationConverter implements SchemaMutationConverter<SetAttributeSchemaLocalizedMutation, GrpcSetAttributeSchemaLocalizedMutation> {

    convert(mutation: GrpcSetAttributeSchemaLocalizedMutation): SetAttributeSchemaLocalizedMutation {
        return new SetAttributeSchemaLocalizedMutation(
            mutation.name,
            mutation.localized
        )
    }
}
