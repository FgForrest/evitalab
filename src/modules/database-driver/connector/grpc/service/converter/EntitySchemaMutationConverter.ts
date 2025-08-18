import type { EntitySchemaMutation } from '@/modules/database-driver/request-response/cdc/EntitySchemaMutation.ts'
import type {
    GrpcEntitySchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEntitySchemaMutation_pb.ts'
import type {
    GrpcCreateAssociatedDataSchemaMutation, GrpcModifyAssociatedDataSchemaDeprecationNoticeMutation,
    GrpcModifyAssociatedDataSchemaDescriptionMutation, GrpcModifyAssociatedDataSchemaNameMutation,
    GrpcModifyAssociatedDataSchemaTypeMutation, GrpcRemoveAssociatedDataSchemaMutation,
    GrpcSetAssociatedDataSchemaLocalizedMutation, GrpcSetAssociatedDataSchemaNullableMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAssociatedDataSchemaMutations_pb.ts'
import {
    CreateAssociatedDataSchemaMutation
} from '@/modules/database-driver/request-response/cdc/CreateAssociatedDataSchemaMutation.ts'
import {
    ModifyAssociatedDataSchemaDeprecationNoticeMutation
} from '@/modules/database-driver/request-response/cdc/ModifyAssociatedDataSchemaDeprecationNoticeMutation.ts'
import {
    ModifyAssociatedDataSchemaDescriptionMutation
} from '@/modules/database-driver/request-response/cdc/ModifyAssociatedDataSchemaDescriptionMutation.ts'
import {
    ModifyAssociatedDataSchemaNameMutation
} from '@/modules/database-driver/request-response/cdc/ModifyAssociatedDataSchemaNameMutation.ts'
import {
    ModifyAssociatedDataSchemaTypeMutation
} from '@/modules/database-driver/request-response/cdc/ModifyAssociatedDataSchemaTypeMutation.ts'
import {
    RemoveAssociatedDataSchemaMutation
} from '@/modules/database-driver/request-response/cdc/RemoveAssociatedDataSchemaMutation.ts'
import {
    SetAssociatedDataSchemaLocalizedMutation
} from '@/modules/database-driver/request-response/cdc/SetAssociatedDataSchemaLocalizedMutation.ts'
import {
    SetAssociatedDataSchemaNullableMutation
} from '@/modules/database-driver/request-response/cdc/SetAssociatedDataSchemaNullableMutation.ts'
import {
    CreateAttributeSchemaMutation
} from '@/modules/database-driver/request-response/cdc/CreateAttributeSchemaMutation.ts'
import type {
    GrpcCreateAttributeSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAttributeSchemaMutations_pb.ts'
import type { ScopesConverter } from '@/modules/database-driver/connector/grpc/service/converter/ScopesConverter.ts'

export class EntitySchemaMutationConverter {
    private readonly scopesConverter: ScopesConverter

    constructor(scopesConverter: ScopesConverter) {
        this.scopesConverter = scopesConverter
    }

    convertEntitySchemaMutation(entitySchemaMutation: GrpcEntitySchemaMutation): EntitySchemaMutation {
        switch (entitySchemaMutation.mutation.case) {
            case 'createAssociatedDataSchemaMutation':
                return this.convertCreateAssociatedDataSchemaMutation(entitySchemaMutation.mutation.value)
            case 'modifyAssociatedDataSchemaDeprecationNoticeMutation':
                return this.convertModifyAssociatedDataSchemaDeprecationNoticeMutation(entitySchemaMutation.mutation.value)
            case 'modifyAssociatedDataSchemaDescriptionMutation':
                return this.convertModifyAssociatedDataSchemaDescriptionMutation(entitySchemaMutation.mutation.value)
            case 'modifyAssociatedDataSchemaNameMutation':
                return this.convertModifyAssociatedDataSchemaNameMutation(entitySchemaMutation.mutation.value)
            case 'modifyAssociatedDataSchemaTypeMutation':
                return this.convertModifyAssociatedDataSchemaTypeMutation(entitySchemaMutation.mutation.value)
            case 'removeAssociatedDataSchemaMutation':
                return this.convertRemoveAssociatedDataSchemaMutation(entitySchemaMutation.mutation.value)
            case 'setAssociatedDataSchemaLocalizedMutation':
                return this.convertSetAssociatedDataSchemaLocalizedMutation(entitySchemaMutation.mutation.value)
            case 'setAssociatedDataSchemaNullableMutation':
                return this.convertSetAssociatedDataSchemaNullableMutation(entitySchemaMutation.mutation.value)
            case 'createAttributeSchemaMutation':
                return this.convertCreateAttributeSchemaMutation(entitySchemaMutation.mutation.value)

            case 'modifyAttributeSchemaDefaultValueMutation':
                // TODO
                break
            case 'modifyAttributeSchemaDeprecationNoticeMutation':
                // TODO
                break
            case 'modifyAttributeSchemaDescriptionMutation':
                // TODO
                break
            case 'modifyAttributeSchemaNameMutation':
                // TODO
                break
            case 'modifyAttributeSchemaTypeMutation':
                // TODO
                break
            case 'removeAttributeSchemaMutation':
                // TODO
                break
            case 'setAttributeSchemaFilterableMutation':
                // TODO
                break
            case 'setAttributeSchemaLocalizedMutation':
                // TODO
                break
            case 'setAttributeSchemaNullableMutation':
                // TODO
                break
            case 'setAttributeSchemaRepresentativeMutation':
                // TODO
                break
            case 'setAttributeSchemaSortableMutation':
                // TODO
                break
            case 'setAttributeSchemaUniqueMutation':
                // TODO
                break
            case 'useGlobalAttributeSchemaMutation':
                // TODO
                break

            case 'allowCurrencyInEntitySchemaMutation':
                // TODO
                break
            case 'allowEvolutionModeInEntitySchemaMutation':
                // TODO
                break
            case 'allowLocaleInEntitySchemaMutation':
                // TODO
                break
            case 'disallowCurrencyInEntitySchemaMutation':
                // TODO
                break
            case 'disallowEvolutionModeInEntitySchemaMutation':
                // TODO
                break
            case 'disallowLocaleInEntitySchemaMutation':
                // TODO
                break
            case 'modifyEntitySchemaDeprecationNoticeMutation':
                // TODO
                break
            case 'modifyEntitySchemaDescriptionMutation':
                // TODO
                break
            case 'setEntitySchemaWithGeneratedPrimaryKeyMutation':
                // TODO
                break
            case 'setEntitySchemaWithHierarchyMutation':
                // TODO
                break
            case 'setEntitySchemaWithPriceMutation':
                // TODO
                break
            case 'modifyEntitySchemaNameMutation':
                // TODO
                break
            case 'removeEntitySchemaMutation':
                // TODO
                break
            case 'createEntitySchemaMutation':
                // TODO
                break

            case 'createReferenceSchemaMutation':
                // TODO
                break
            case 'modifyReferenceAttributeSchemaMutation':
                // TODO
                break
            case 'modifyReferenceSchemaCardinalityMutation':
                // TODO
                break
            case 'modifyReferenceSchemaDeprecationNoticeMutation':
                // TODO
                break
            case 'modifyReferenceSchemaDescriptionMutation':
                // TODO
                break
            case 'modifyReferenceSchemaNameMutation':
                // TODO
                break
            case 'modifyReferenceSchemaRelatedEntityGroupMutation':
                // TODO
                break
            case 'modifyReferenceSchemaRelatedEntityMutation':
                // TODO
                break
            case 'removeReferenceSchemaMutation':
                // TODO
                break
            case 'setReferenceSchemaFacetedMutation':
                // TODO
                break
            case 'setReferenceSchemaIndexedMutation':
                // TODO
                break

            case 'createReflectedReferenceSchemaMutation':
                // TODO
                break
            case 'modifyReflectedReferenceAttributeInheritanceSchemaMutation':
                // TODO
                break
            case 'ModifyReferenceSortableAttributeCompoundSchemaMutation':
                // TODO
                break
            case 'createSortableAttributeCompoundSchemaMutation':
                // TODO
                break
            case 'modifySortableAttributeCompoundSchemaDeprecationNoticeMutation':
                // TODO
                break
            case 'modifySortableAttributeCompoundSchemaDescriptionMutation':
                // TODO
                break
            case 'modifySortableAttributeCompoundSchemaNameMutation':
                // TODO
                break
            case 'removeSortableAttributeCompoundSchemaMutation':
                // TODO
                break
            case 'setSortableAttributeCompoundIndexedMutation':
                // TODO
                break

            default:
                break
        }
    }

    private convertCreateAssociatedDataSchemaMutation(createAssociatedDataSchemaMutation: GrpcCreateAssociatedDataSchemaMutation): CreateAssociatedDataSchemaMutation {
        return new CreateAssociatedDataSchemaMutation(
            createAssociatedDataSchemaMutation.name,
            createAssociatedDataSchemaMutation.type,
            createAssociatedDataSchemaMutation.localized,
            createAssociatedDataSchemaMutation.nullable,
            createAssociatedDataSchemaMutation.description,
            createAssociatedDataSchemaMutation.deprecationNotice
        )
    }

    private convertModifyAssociatedDataSchemaDeprecationNoticeMutation(modifyAssociatedDataSchemaDeprecationNoticeMutation: GrpcModifyAssociatedDataSchemaDeprecationNoticeMutation): ModifyAssociatedDataSchemaDeprecationNoticeMutation {
        return new ModifyAssociatedDataSchemaDeprecationNoticeMutation(
            modifyAssociatedDataSchemaDeprecationNoticeMutation.name,
            modifyAssociatedDataSchemaDeprecationNoticeMutation.deprecationNotice
        )
    }

    private convertModifyAssociatedDataSchemaDescriptionMutation(modifyAssociatedDataSchemaDescriptionMutation: GrpcModifyAssociatedDataSchemaDescriptionMutation): ModifyAssociatedDataSchemaDescriptionMutation {
        return new ModifyAssociatedDataSchemaDescriptionMutation(
            modifyAssociatedDataSchemaDescriptionMutation.name,
            modifyAssociatedDataSchemaDescriptionMutation.description
        )
    }

    private convertModifyAssociatedDataSchemaNameMutation(modifyAssociatedDataSchemaNameMutation: GrpcModifyAssociatedDataSchemaNameMutation): ModifyAssociatedDataSchemaNameMutation {
        return new ModifyAssociatedDataSchemaNameMutation(
            modifyAssociatedDataSchemaNameMutation.name,
            modifyAssociatedDataSchemaNameMutation.newName
        )
    }

    private convertModifyAssociatedDataSchemaTypeMutation(modifyAssociatedDataSchemaTypeMutation: GrpcModifyAssociatedDataSchemaTypeMutation): ModifyAssociatedDataSchemaTypeMutation {
        return new ModifyAssociatedDataSchemaTypeMutation(
            modifyAssociatedDataSchemaTypeMutation.name,
            modifyAssociatedDataSchemaTypeMutation.type
        )
    }

    private convertRemoveAssociatedDataSchemaMutation(removeAssociatedDataSchemaMutation: GrpcRemoveAssociatedDataSchemaMutation): RemoveAssociatedDataSchemaMutation {
        return new RemoveAssociatedDataSchemaMutation(
            removeAssociatedDataSchemaMutation.name
        )
    }

    private convertSetAssociatedDataSchemaLocalizedMutation(setAssociatedDataSchemaLocalizedMutation: GrpcSetAssociatedDataSchemaLocalizedMutation): SetAssociatedDataSchemaLocalizedMutation {
        return new SetAssociatedDataSchemaLocalizedMutation(
            setAssociatedDataSchemaLocalizedMutation.name,
            setAssociatedDataSchemaLocalizedMutation.localized
        )
    }

    private convertSetAssociatedDataSchemaNullableMutation(setAssociatedDataSchemaNullableMutation: GrpcSetAssociatedDataSchemaNullableMutation): SetAssociatedDataSchemaNullableMutation {
        return new SetAssociatedDataSchemaNullableMutation(
            setAssociatedDataSchemaNullableMutation.name,
            setAssociatedDataSchemaNullableMutation.nullable
        )
    }

    private convertCreateAttributeSchemaMutation(createAttributeSchemaMutation: GrpcCreateAttributeSchemaMutation): CreateAttributeSchemaMutation {
        return new CreateAttributeSchemaMutation(
            createAttributeSchemaMutation.name,
            createAttributeSchemaMutation.description,
            createAttributeSchemaMutation.deprecationNotice,
            createAttributeSchemaMutation.localized,
            createAttributeSchemaMutation.nullable,
            createAttributeSchemaMutation.representative,
            createAttributeSchemaMutation.type,
            createAttributeSchemaMutation.indexedDecimalPlaces,
            createAttributeSchemaMutation.defaultValue,
            this.scopesConverter.convertUniqueInScopes(createAttributeSchemaMutation.uniqueInScopes),
            this.scopesConverter.convertEntityScopes(createAttributeSchemaMutation.filterableInScopes),
            this.scopesConverter.convertEntityScopes(createAttributeSchemaMutation.sortableInScopes)
        )
    }
}
