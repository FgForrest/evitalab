import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'
import {
    CreateEntitySchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/catalog/CreateEntitySchemaMutationConverter.ts'
import {
    RemoveEntitySchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/catalog/RemoveEntitySchemaMutationConverter.ts'
import {
    CreateAssociatedDataSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/associated-data/CreateAssociatedDataSchemaMutationConverter.ts'
import {
    ModifyAssociatedDataSchemaDeprecationNoticeMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/associated-data/ModifyAssociatedDataSchemaDeprecationNoticeMutationConverter.ts'
import {
    ModifyAssociatedDataSchemaDescriptionMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/associated-data/ModifyAssociatedDataSchemaDescriptionMutationConverter.ts'
import {
    ModifyAssociatedDataSchemaNameMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/associated-data/ModifyAssociatedDataSchemaNameMutationConverter.ts'
import {
    ModifyAssociatedDataSchemaTypeMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/associated-data/ModifyAssociatedDataSchemaTypeMutationConverter.ts'
import {
    RemoveAssociatedDataSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/associated-data/RemoveAssociatedDataSchemaMutationConverter.ts'
import {
    SetAssociatedDataSchemaLocalizedMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/associated-data/SetAssociatedDataSchemaLocalizedMutationConverter.ts'
import {
    SetAssociatedDataSchemaNullableMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/associated-data/SetAssociatedDataSchemaNullableMutationConverter.ts'
import {
    CreateAttributeSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/CreateAttributeSchemaMutationConverter.ts'
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
    ModifyAttributeSchemaTypeMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/ModifyAttributeSchemaTypeMutationConverter.ts'
import {
    RemoveAttributeSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/RemoveAttributeSchemaMutationConverter.ts'
import {
    SetAttributeSchemaLocalizedMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/SetAttributeSchemaLocalizedMutationConverter.ts'
import {
    SetAttributeSchemaRepresentativeMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/SetAttributeSchemaRepresentativeMutationConverter.ts'
import {
    SetAttributeSchemaUniqueMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/SetAttributeSchemaUniqueMutationConverter.ts'
import {
    UseGlobalAttributeSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/UseGlobalAttributeSchemaMutationConverter.ts'
import {
    SetAttributeSchemaSortableMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/SetAttributeSchemaSortableMutationConverter.ts'
import {
    SetAttributeSchemaNullableMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/SetAttributeSchemaNullableMutationConverter.ts'
import {
    SetAttributeSchemaFilterableMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/SetAttributeSchemaFilterableMutationConverter.ts'
import {
    ModifyAttributeSchemaNameMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/ModifyAttributeSchemaNameMutationConverter.ts'
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
import {
    SetSortableAttributeCompoundIndexedMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortableAttributeCompound/SetSortableAttributeCompoundIndexedMutationConverter.ts'
import {
    AllowCurrencyInEntitySchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/entity/AllowCurrencyInEntitySchemaMutationConverter.ts'
import {
    AllowEvolutionModeInEntitySchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/entity/AllowEvolutionModeInEntitySchemaMutationConverter.ts'
import {
    DisallowEvolutionModeInEntitySchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/entity/DisallowEvolutionModeInEntitySchemaMutationConverter.ts'
import {
    DisallowLocaleInEntitySchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/entity/DisallowLocaleInEntitySchemaMutationConverter.ts'
import {
    ModifyEntitySchemaNameMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/catalog/ModifyEntitySchemaNameMutationConverter.ts'
import {
    ModifyEntitySchemaDeprecationNoticeMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/entity/ModifyEntitySchemaDeprecationNoticeMutationConverter.ts'
import {
    ModifyEntitySchemaDescriptionMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/entity/ModifyEntitySchemaDescriptionMutationConverter.ts'
import {
    SetEntitySchemaWithGeneratedPrimaryKeyMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/entity/SetEntitySchemaWithGeneratedPrimaryKeyMutationConverter.ts'
import {
    SetEntitySchemaWithHierarchyMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/entity/SetEntitySchemaWithHierarchyMutationConverter.ts'
import {
    SetEntitySchemaWithPriceMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/entity/SetEntitySchemaWithPriceMutationConverter.ts'
import {
    CreateReferenceSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/reference/CreateReferenceSchemaMutationConverter.ts'
import {
    CreateReflectedReferenceSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/reference/CreateReflectedReferenceSchemaMutationConverter.ts'
import {
    ModifyReferenceAttributeSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/reference/ModifyReferenceAttributeSchemaMutationConverter.ts'
import {
    ModifyReferenceSchemaCardinalityMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/reference/ModifyReferenceSchemaCardinalityMutationConverter.ts'
import {
    ModifyReferenceSchemaDeprecationNoticeMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/reference/ModifyReferenceSchemaDeprecationNoticeMutationConverter.ts'
import {
    ModifyReferenceSchemaDescriptionMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/reference/ModifyReferenceSchemaDescriptionMutationConverter.ts'
import {
    ModifyReferenceSchemaNameMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/reference/ModifyReferenceSchemaNameMutationConverter.ts'
import {
    ModifyReferenceSchemaRelatedEntityGroupMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/reference/ModifyReferenceSchemaRelatedEntityGroupMutation.ts'
import {
    ModifyReferenceSchemaRelatedEntityMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/reference/ModifyReferenceSchemaRelatedEntityMutationConverter.ts'
import {
    ModifyReflectedReferenceAttributeInheritanceSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/reference/ModifyReflectedReferenceAttributeInheritanceSchemaMutation.ts'
import {
    RemoveReferenceSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/reference/RemoveReferenceSchemaMutationConverter.ts'
import {
    SetReferenceSchemaFacetedMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/reference/SetReferenceSchemaFacetedMutationConverter.ts'
import {
    SetReferenceSchemaIndexedMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/reference/SetReferenceSchemaIndexedMutation.ts'
import {
    ModifyReferenceSortableAttributeCompoundSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/reference/ModifyReferenceSortableAttributeCompoundSchemaMutation.ts'
import {
    AllowLocaleInEntitySchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/entity/AllowLocaleInEntitySchemaMutationConverter.ts'
import type {
    GrpcEntitySchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEntitySchemaMutation_pb.ts'
import type { SchemaMutation } from '@/modules/database-driver/request-response/schema/mutation/SchemaMutation.ts'
import {
    DisallowCurrencyInEntitySchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/entity/DisallowCurrencyInEntitySchemaMutationConverter.ts'
import {
    ModifyEntitySchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/catalog/ModifyEntitySchemaMutationConverter.ts'
import {
    DuplicateCatalogMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/engine/DuplicateCatalogMutationConverter.ts'
import {
    SetCatalogMutabilityMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/engine/SetCatalogMutabilityMutationConverter.ts'
import {
    SetCatalogStateMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/engine/SetCatalogStateMutationConverter.ts'
import {
    TransactionMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/engine/TransactionMutationConverter.ts'
import {
    RemoveCatalogSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/engine/RemoveCatalogSchemaMutationConverter.ts'
import {
    MakeCatalogAliveMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/engine/MakeCatalogAliveMutationConverter.ts'
import {
    ModifyCatalogSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/engine/ModifyCatalogSchemaMutationConverter.ts'
import {
    CreateCatalogSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/engine/CreateCatalogSchemaMutationConverter.ts'
import {
    ModifyCatalogSchemaNameMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/engine/ModifyCatalogSchemaNameMutationConverter.ts'


function getKeyFromConverterName(converter: any): string {
    // Handle both class constructors and instances
    const name = typeof converter === 'function' ? converter.name : converter.constructor.name;

    return name
        .replace(/Converter$/, '') // Remove 'Converter' suffix
        .replace(/([A-Z])/g, (match: string, p1: string, offset: number) =>
            offset === 0 ? p1.toLowerCase() : p1
        ); // Convert first letter to lowercase, keep others as-is
}

export class DelegatingEngineMutationConverter {


    private static readonly TO_TYPESCRIPT_CONVERTERS = new Map<string, any>(
        [
            CreateCatalogSchemaMutationConverter.INSTANCE,
            ModifyCatalogSchemaNameMutationConverter.INSTANCE,
            ModifyCatalogSchemaMutationConverter.INSTANCE,
            MakeCatalogAliveMutationConverter.INSTANCE,
            RemoveCatalogSchemaMutationConverter.INSTANCE,
            TransactionMutationConverter.INSTANCE,
            DuplicateCatalogMutationConverter.INSTANCE,
            SetCatalogMutabilityMutationConverter.INSTANCE,
            SetCatalogStateMutationConverter.INSTANCE
        ].map(converter => [getKeyFromConverterName(converter), converter])
    );

    static convert(mutation: GrpcEntitySchemaMutation | undefined): SchemaMutation {
        if (!mutation?.mutation?.case) {
            throw new UnexpectedError('Unknown mutation type: ' + mutation?.mutation.case)
        }

        const converter = DelegatingEngineMutationConverter.TO_TYPESCRIPT_CONVERTERS.get(mutation.mutation.case)
        if (!converter) {
            throw new UnexpectedError('Unknown mutation type: ' + mutation.mutation.case)
        }

        return converter.convert(mutation.mutation.value)
    }
}

