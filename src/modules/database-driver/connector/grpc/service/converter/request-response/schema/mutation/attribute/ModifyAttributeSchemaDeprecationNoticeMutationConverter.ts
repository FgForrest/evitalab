import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    ModifyAttributeSchemaDeprecationNoticeMutation
} from '@/modules/database-driver/request-response/schema/mutation/attribute/ModifyAttributeSchemaDeprecationNoticeMutation.ts'
import type {
    GrpcModifyAttributeSchemaDeprecationNoticeMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAttributeSchemaMutations_pb.ts'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'

export class ModifyAttributeSchemaDeprecationNoticeMutationConverter implements SchemaMutationConverter<ModifyAttributeSchemaDeprecationNoticeMutation, GrpcModifyAttributeSchemaDeprecationNoticeMutation> {
    public static readonly INSTANCE = new ModifyAttributeSchemaDeprecationNoticeMutationConverter()

    convert(mutation: GrpcModifyAttributeSchemaDeprecationNoticeMutation): ModifyAttributeSchemaDeprecationNoticeMutation {

        return new ModifyAttributeSchemaDeprecationNoticeMutation(
            mutation.name,
            mutation.deprecationNotice
        )
    }
}
