import {
    ModifyAssociatedDataSchemaDeprecationNoticeMutation
} from '@/modules/database-driver/request-response/schema/mutation/associatedData/ModifyAssociatedDataSchemaDeprecationNoticeMutation.ts'
import type {
    GrpcModifyAssociatedDataSchemaDeprecationNoticeMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAssociatedDataSchemaMutations_pb.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'

export class ModifyAssociatedDataSchemaDeprecationNoticeMutationConverter implements SchemaMutationConverter<ModifyAssociatedDataSchemaDeprecationNoticeMutation, GrpcModifyAssociatedDataSchemaDeprecationNoticeMutation> {

    convert(mutation: GrpcModifyAssociatedDataSchemaDeprecationNoticeMutation): ModifyAssociatedDataSchemaDeprecationNoticeMutation {
        return new ModifyAssociatedDataSchemaDeprecationNoticeMutation(
            mutation.name,
            mutation.deprecationNotice
        )
    }
}
