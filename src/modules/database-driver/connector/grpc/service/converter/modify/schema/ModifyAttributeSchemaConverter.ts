import type {
    GrpcModifyAttributeSchemaDefaultValueMutation,
    GrpcModifyAttributeSchemaDeprecationNoticeMutation, GrpcModifyAttributeSchemaDescriptionMutation,
    GrpcModifyAttributeSchemaNameMutation, GrpcModifyAttributeSchemaTypeMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAttributeSchemaMutations_pb.ts'
import {
    ModifyAttributeSchemaDefaultValueMutation
} from '@/modules/database-driver/request-response/cdc/ModifyAttributeSchemaDefaultValueMutation.ts'
import {
    ModifyAttributeSchemaDescriptionMutation
} from '@/modules/database-driver/request-response/cdc/ModifyAttributeSchemaDescriptionMutation.ts'
import {
    ModifyAttributeSchemaDeprecationNoticeMutation
} from '@/modules/database-driver/request-response/cdc/ModifyAttributeSchemaDeprecationNoticeMutation.ts'
import {
    ModifyAttributeSchemaNameMutation
} from '@/modules/database-driver/request-response/cdc/ModifyAttributeSchemaNameMutation.ts'
import {
    ModifyAttributeSchemaTypeMutation
} from '@/modules/database-driver/request-response/cdc/ModifyAttributeSchemaTypeMutation.ts'

export class ModifyAttributeSchemaConverter {
    public convertModifyAttributeSchemaDefaultValueMutation(modifyAttributeSchemaDefaultValueMutation: GrpcModifyAttributeSchemaDefaultValueMutation): ModifyAttributeSchemaDefaultValueMutation {
        return new ModifyAttributeSchemaDefaultValueMutation(
            modifyAttributeSchemaDefaultValueMutation.name,
            modifyAttributeSchemaDefaultValueMutation.defaultValue
        )
    }

    public convertAttributeSchemaDeprecationNoticeMutation(attributeSchemaDeprecationNoticeMutation: GrpcModifyAttributeSchemaDeprecationNoticeMutation): ModifyAttributeSchemaDeprecationNoticeMutation {
        return new ModifyAttributeSchemaDeprecationNoticeMutation(
            attributeSchemaDeprecationNoticeMutation.name,
            attributeSchemaDeprecationNoticeMutation.deprecationNotice
        )
    }

    public convertModifyAttributeSchemaDescriptionMutation(modifyAttributeSchemaDescriptionMutation: GrpcModifyAttributeSchemaDescriptionMutation): ModifyAttributeSchemaDescriptionMutation {
        return new ModifyAttributeSchemaDescriptionMutation(
            modifyAttributeSchemaDescriptionMutation.name,
            modifyAttributeSchemaDescriptionMutation.description,
        )
    }

    public convertModifyAttributeSchemaNameMutation(modifyAttributeSchemaNameMutation: GrpcModifyAttributeSchemaNameMutation): ModifyAttributeSchemaNameMutation {
        return new ModifyAttributeSchemaNameMutation(
            modifyAttributeSchemaNameMutation.name,
            modifyAttributeSchemaNameMutation.newName
        )
    }

    public convertModifyAttributeSchemaTypeMutation(modifyAttributeSchemaTypeMutation: GrpcModifyAttributeSchemaTypeMutation): ModifyAttributeSchemaTypeMutation {
        return new ModifyAttributeSchemaTypeMutation(
            modifyAttributeSchemaTypeMutation.name,
            modifyAttributeSchemaTypeMutation.type,
            modifyAttributeSchemaTypeMutation.indexedDecimalPlaces
        )
    }
}
