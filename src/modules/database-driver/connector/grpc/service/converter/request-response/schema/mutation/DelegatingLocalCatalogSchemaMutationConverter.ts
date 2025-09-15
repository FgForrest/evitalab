import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'
import type {
    GrpcSortableAttributeCompoundSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcSortableAttributeCompoundSchemaMutations_pb.ts'

import {
    CreateSortableAttributeCompoundSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortableAttributeCompound/CreateSortableAttributeCompoundSchemaMutationConverter.ts'
import {
    ModifySortableAttributeCompoundSchemaDeprecationNoticeMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortableAttributeCompound/ModifySortableAttributeCompoundSchemaDeprecationNoticeMutationConverter.ts'
import {
    ModifySortableAttributeCompoundSchemaDescriptionMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortableAttributeCompound/ModifySortableAttributeCompoundSchemaDescriptionMutationConverter.ts'
import {
    ModifySortableAttributeCompoundSchemaNameMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortableAttributeCompound/ModifySortableAttributeCompoundSchemaNameMutationConverter.ts'
import {
    RemoveSortableAttributeCompoundSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortableAttributeCompound/RemoveSortableAttributeCompoundSchemaMutationConverter.ts'
import type {
    ReferenceSortableAttributeCompoundSchemaMutation
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortableAttributeCompound/ReferenceSortableAttributeCompoundSchemaMutation.ts'
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


function getKeyFromConverterName(converter: any): string {
    return converter.name
        .replace(/Converter$/, '') // Remove 'Converter' suffix
        .replace(/([A-Z])/g, (match: string, p1: string, offset: number) =>
            offset === 0 ? p1.toLowerCase() : p1.toLowerCase()
        ); // Convert to camelCase
}

export class DelegatingLocalCatalogSchemaMutationConverter {


    private static readonly TO_TYPESCRIPT_CONVERTERS = new Map<string, any>(
        [
            CreateGlobalAttributeSchemaMutationConverter,
            ModifyAttributeSchemaDefaultValueMutationConverter,
            ModifyAttributeSchemaDeprecationNoticeMutationConverter,
            ModifyAttributeSchemaDescriptionMutationConverter,
            ModifyAttributeSchemaNameMutationConverter,
            ModifyAttributeSchemaTypeMutationConverter,
            RemoveAttributeSchemaMutationConverter,
            SetAttributeSchemaFilterableMutationConverter,
            SetAttributeSchemaGloballyUniqueMutationConverter,
            SetAttributeSchemaLocalizedMutationConverter,
            SetAttributeSchemaNullableMutationConverter,
            SetAttributeSchemaRepresentativeMutationConverter,
            SetAttributeSchemaSortableMutationConverter,
            // entity schema mutations
            CreateEntitySchemaMutationConverter,
            ModifyEntitySchemaMutationConverter,
            ModifyEntitySchemaNameMutationConverter,
            RemoveEntitySchemaMutationConverter
        ].map(converter => [getKeyFromConverterName(converter), converter])
    );

    static convert(mutation: GrpcLocalCatalogSchemaMutation | undefined): LocalCatalogSchemaMutation {
        if (!mutation?.mutation?.case) {
            throw new UnexpectedError('Unknown mutation type: ' + mutation?.mutation.case)
        }

        const conversionDescriptor = this.TO_TYPESCRIPT_CONVERTERS.get(mutation.mutation.case)
        if (!conversionDescriptor) {
            throw new UnexpectedError('Unknown mutation type: ' + mutation.mutation.case)
        }

        return mutation.mutation.value
    }
}

