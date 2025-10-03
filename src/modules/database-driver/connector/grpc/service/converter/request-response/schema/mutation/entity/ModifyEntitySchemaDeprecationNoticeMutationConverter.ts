import type {
    GrpcModifyEntitySchemaDeprecationNoticeMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEntitySchemaMutations_pb.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    ModifyEntitySchemaDeprecationNoticeMutation
} from '@/modules/database-driver/request-response/schema/mutation/entity/ModifyEntitySchemaDeprecationNoticeMutation.ts'

export class ModifyEntitySchemaDeprecationNoticeMutationConverter implements SchemaMutationConverter<ModifyEntitySchemaDeprecationNoticeMutation, GrpcModifyEntitySchemaDeprecationNoticeMutation> {

    convert(mutation: GrpcModifyEntitySchemaDeprecationNoticeMutation): ModifyEntitySchemaDeprecationNoticeMutation {
        return new ModifyEntitySchemaDeprecationNoticeMutation(mutation.deprecationNotice)
    }
}
