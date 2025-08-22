//todo: lho
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
import type {
    ModifyAttributeSchemaConverter
} from '@/modules/database-driver/connector/grpc/service/converter/modify/schema/ModifyAttributeSchemaConverter.ts'
import type {
    RemoveAttributeSchemaConverter
} from '@/modules/database-driver/connector/grpc/service/converter/remove/schema/RemoveAttributeSchemaConverter.ts'
import type {
    SetAttributeSchemaConverter
} from '@/modules/database-driver/connector/grpc/service/converter/set/schema/SetAttributeSchemaConverter.ts'
import type {
    CreateEntitySchemaConverter
} from '@/modules/database-driver/connector/grpc/service/converter/create/schema/CreateEntitySchemaConverter.ts'
import type {
    ModifyEntitySchemaMutation
} from '@/modules/database-driver/request-response/cdc/ModifyEntitySchemaMutation.ts'
import { List as ImmutableList } from 'immutable'

export class EntitySchemaMutationConverter {
    private readonly scopesConverter: ScopesConverter
    private readonly modifyAttributeSchemaConverter: ModifyAttributeSchemaConverter
    private readonly removeAttributeSchemaConverter: RemoveAttributeSchemaConverter
    private readonly setAttributeSchemaConverter: SetAttributeSchemaConverter
    private readonly createEntitySchemaConverter: CreateEntitySchemaConverter

    constructor(scopesConverter: ScopesConverter, modifyAttributeSchemaConverter: ModifyAttributeSchemaConverter, removeAttributeSchemaConverter: RemoveAttributeSchemaConverter, setAttributeSchemaConverter: SetAttributeSchemaConverter, createEntitySchemaConverter: CreateEntitySchemaConverter) {
        this.scopesConverter = scopesConverter
        this.modifyAttributeSchemaConverter = modifyAttributeSchemaConverter
        this.removeAttributeSchemaConverter = removeAttributeSchemaConverter
        this.setAttributeSchemaConverter = setAttributeSchemaConverter
        this.createEntitySchemaConverter = createEntitySchemaConverter
    }

    convertEntitySchemaMutations(entitySchemaMutations: GrpcEntitySchemaMutation[]): ImmutableList<EntitySchemaMutation> {
        const convertedEntitySchemaMutations: EntitySchemaMutation[] = []
        for (const mutation of entitySchemaMutations) {
            convertedEntitySchemaMutations.push(this.convertEntitySchemaMutation(mutation))
        }

        return ImmutableList<EntitySchemaMutation>(convertedEntitySchemaMutations)
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
                return this.modifyAttributeSchemaConverter.convertModifyAttributeSchemaDefaultValueMutation(entitySchemaMutation.mutation.value)
            case 'modifyAttributeSchemaDeprecationNoticeMutation':
                return this.modifyAttributeSchemaConverter.convertAttributeSchemaDeprecationNoticeMutation(entitySchemaMutation.mutation.value)
            case 'modifyAttributeSchemaDescriptionMutation':
                return this.modifyAttributeSchemaConverter.convertModifyAttributeSchemaDescriptionMutation(entitySchemaMutation.mutation.value)
            case 'modifyAttributeSchemaNameMutation':
                return this.modifyAttributeSchemaConverter.convertModifyAttributeSchemaNameMutation(entitySchemaMutation.mutation.value)
            case 'modifyAttributeSchemaTypeMutation':
                return this.modifyAttributeSchemaConverter.convertModifyAttributeSchemaTypeMutation(entitySchemaMutation.mutation.value)
            case 'removeAttributeSchemaMutation':
                return this.removeAttributeSchemaConverter.convertRemoveAttributeSchemaMutation(entitySchemaMutation.mutation.value)
            case 'setAttributeSchemaFilterableMutation':
                return this.setAttributeSchemaConverter.convertSetAttributeSchemaFilterableMutation(entitySchemaMutation.mutation.value)
            case 'setAttributeSchemaLocalizedMutation':
                return this.setAttributeSchemaConverter.convertSetAttributeSchemaLocalizedMutation(entitySchemaMutation.mutation.value)
            case 'setAttributeSchemaNullableMutation':
                return this.setAttributeSchemaConverter.convertSetAttributeSchemaNullableMutation(entitySchemaMutation.mutation.value)
            case 'setAttributeSchemaRepresentativeMutation':
                return this.setAttributeSchemaConverter.convertSetAttributeSchemaRepresentativeMutation(entitySchemaMutation.mutation.value)
            case 'setAttributeSchemaSortableMutation':
                return this.setAttributeSchemaConverter.convertSetAttributeSchemaSortableMutation(entitySchemaMutation.mutation.value)
            case 'setAttributeSchemaUniqueMutation':
                return this.setAttributeSchemaConverter.convertSetAttributeSchemaUniqueMutation(entitySchemaMutation.mutation.value)
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
                // TODO return set
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
                return this.createEntitySchemaConverter.convertCreateEntitySchemaMutation(entitySchemaMutation.mutation.value)
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
