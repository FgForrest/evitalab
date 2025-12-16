import type {
    GrpcModifyReferenceSchemaDeprecationNoticeMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcReferenceSchemaMutations_pb.ts'
import {
    ModifyReferenceSchemaDeprecationNoticeMutation
} from '@/modules/database-driver/request-response/schema/mutation/reference/ModifyReferenceSchemaDeprecationNoticeMutation.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'

export class ModifyReferenceSchemaDeprecationNoticeMutationConverter implements SchemaMutationConverter<ModifyReferenceSchemaDeprecationNoticeMutation, GrpcModifyReferenceSchemaDeprecationNoticeMutation> {
    public static readonly INSTANCE = new ModifyReferenceSchemaDeprecationNoticeMutationConverter()

    convert(mutation: GrpcModifyReferenceSchemaDeprecationNoticeMutation): ModifyReferenceSchemaDeprecationNoticeMutation {
        return new ModifyReferenceSchemaDeprecationNoticeMutation(
            mutation.name,
            mutation.deprecationNotice
        )
    }
}
