import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'
import {
    CreateGlobalAttributeSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/CreateGlobalAttributeSchemaMutationConverter.ts'
import {
    ModifyAttributeSchemaDefaultValueMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/ModifyAttributeSchemaDefaultValueMutationConverter.ts'
import {
    ModifyAttributeSchemaDeprecationNoticeMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/ModifyAttributeSchemaDeprecationNoticeMutationConverter.ts'
import {
    ModifyAttributeSchemaDescriptionMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/ModifyAttributeSchemaDescriptionMutationConverter.ts'
import {
    ModifyAttributeSchemaNameMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/ModifyAttributeSchemaNameMutationConverter.ts'
import {
    ModifyAttributeSchemaTypeMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/ModifyAttributeSchemaTypeMutationConverter.ts'
import {
    RemoveAttributeSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/RemoveAttributeSchemaMutationConverter.ts'
import {
    SetAttributeSchemaFilterableMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/SetAttributeSchemaFilterableMutationConverter.ts'
import {
    SetAttributeSchemaGloballyUniqueMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/SetAttributeSchemaGloballyUniqueMutationConverter.ts'
import {
    SetAttributeSchemaLocalizedMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/SetAttributeSchemaLocalizedMutationConverter.ts'
import {
    SetAttributeSchemaNullableMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/SetAttributeSchemaNullableMutationConverter.ts'
import {
    SetAttributeSchemaRepresentativeMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/SetAttributeSchemaRepresentativeMutationConverter.ts'
import {
    SetAttributeSchemaSortableMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/SetAttributeSchemaSortableMutationConverter.ts'
import {
    CreateEntitySchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/catalog/CreateEntitySchemaMutationConverter.ts'
import {
    ModifyEntitySchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/catalog/ModifyEntitySchemaMutationConverter.ts'
import {
    ModifyEntitySchemaNameMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/catalog/ModifyEntitySchemaNameMutationConverter.ts'
import {
    RemoveEntitySchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/catalog/RemoveEntitySchemaMutationConverter.ts'
import type {
    GrpcLocalCatalogSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcCatalogSchemaMutation_pb.ts'
import type {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/LocalCatalogSchemaMutation.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import type { SchemaMutation } from '@/modules/database-driver/request-response/schema/mutation/SchemaMutation.ts'
import type { Message } from '@bufbuild/protobuf'


export class DelegatingLocalCatalogSchemaMutationConverter {

    private static readonly TO_TYPESCRIPT_CONVERTERS = new Map<string, SchemaMutationConverter<SchemaMutation, Message>>([
        // attribute schema mutations
        ['createGlobalAttributeSchemaMutation', CreateGlobalAttributeSchemaMutationConverter.INSTANCE],
        ['modifyAttributeSchemaDefaultValueMutation', ModifyAttributeSchemaDefaultValueMutationConverter.INSTANCE],
        ['modifyAttributeSchemaDeprecationNoticeMutation', ModifyAttributeSchemaDeprecationNoticeMutationConverter.INSTANCE],
        ['modifyAttributeSchemaDescriptionMutation', ModifyAttributeSchemaDescriptionMutationConverter.INSTANCE],
        ['modifyAttributeSchemaNameMutation', ModifyAttributeSchemaNameMutationConverter.INSTANCE],
        ['modifyAttributeSchemaTypeMutation', ModifyAttributeSchemaTypeMutationConverter.INSTANCE],
        ['removeAttributeSchemaMutation', RemoveAttributeSchemaMutationConverter.INSTANCE],
        ['setAttributeSchemaFilterableMutation', SetAttributeSchemaFilterableMutationConverter.INSTANCE],
        ['setAttributeSchemaGloballyUniqueMutation', SetAttributeSchemaGloballyUniqueMutationConverter.INSTANCE],
        ['setAttributeSchemaLocalizedMutation', SetAttributeSchemaLocalizedMutationConverter.INSTANCE],
        ['setAttributeSchemaNullableMutation', SetAttributeSchemaNullableMutationConverter.INSTANCE],
        ['setAttributeSchemaRepresentativeMutation', SetAttributeSchemaRepresentativeMutationConverter.INSTANCE],
        ['setAttributeSchemaSortableMutation', SetAttributeSchemaSortableMutationConverter.INSTANCE],
        // entity schema mutations
        ['createEntitySchemaMutation', CreateEntitySchemaMutationConverter.INSTANCE],
        ['modifyEntitySchemaMutation', ModifyEntitySchemaMutationConverter.INSTANCE],
        ['modifyEntitySchemaNameMutation', ModifyEntitySchemaNameMutationConverter.INSTANCE],
        ['removeEntitySchemaMutation', RemoveEntitySchemaMutationConverter.INSTANCE]
    ]);

    static convert(mutation: GrpcLocalCatalogSchemaMutation | undefined): LocalCatalogSchemaMutation {
        if (!mutation?.mutation?.case) {
            throw new UnexpectedError('Unknown mutation type: ' + mutation?.mutation.case)
        }

        const converter = DelegatingLocalCatalogSchemaMutationConverter.TO_TYPESCRIPT_CONVERTERS.get(mutation.mutation.case)
        if (!converter) {
            throw new UnexpectedError('Unknown mutation type: ' + mutation.mutation.case)
        }

        return converter.convert(mutation.mutation.value)
    }
}

