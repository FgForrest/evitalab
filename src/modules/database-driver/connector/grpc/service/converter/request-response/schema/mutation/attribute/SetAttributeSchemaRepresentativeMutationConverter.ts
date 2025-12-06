import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    SetAttributeSchemaRepresentativeMutation
} from '@/modules/database-driver/request-response/schema/mutation/attribute/SetAttributeSchemaRepresentativeMutation.ts'
import type {
    GrpcSetAttributeSchemaRepresentativeMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAttributeSchemaMutations_pb.ts'

export class SetAttributeSchemaRepresentativeMutationConverter implements SchemaMutationConverter<SetAttributeSchemaRepresentativeMutation, GrpcSetAttributeSchemaRepresentativeMutation> {
    public static readonly INSTANCE = new SetAttributeSchemaRepresentativeMutationConverter()

    convert(mutation: GrpcSetAttributeSchemaRepresentativeMutation): SetAttributeSchemaRepresentativeMutation {
        return new SetAttributeSchemaRepresentativeMutation(
            mutation.name,
            mutation.representative
        )
    }
}
