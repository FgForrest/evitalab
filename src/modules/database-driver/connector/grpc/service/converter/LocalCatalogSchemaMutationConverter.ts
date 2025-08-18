import type {
    GrpcLocalCatalogSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcCatalogSchemaMutation_pb.ts'
import { List as ImmutableList } from 'immutable'
import type {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'
import {
    ModifyCatalogSchemaDescriptionMutation
} from '@/modules/database-driver/request-response/cdc/ModifyCatalogSchemaDescriptionMutation.ts'
import type {
    GrpcAllowEvolutionModeInCatalogSchemaMutation, GrpcDisallowEvolutionModeInCatalogSchemaMutation,
    GrpcModifyCatalogSchemaDescriptionMutation, GrpcModifyEntitySchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcCatalogSchemaMutations_pb.ts'
import {
    AllowEvolutionModeInCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/AllowEvolutionModeInCatalogSchemaMutation.ts'
import type {
    CatalogEvolutionModeConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogEvolutionModeConverter.ts'
import {
    DisallowEvolutionModeInCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/DisallowEvolutionModeInCatalogSchemaMutation.ts'
import type {
    GrpcCreateGlobalAttributeSchemaMutation, GrpcModifyAttributeSchemaDefaultValueMutation,
    GrpcModifyAttributeSchemaDeprecationNoticeMutation, GrpcModifyAttributeSchemaDescriptionMutation,
    GrpcModifyAttributeSchemaNameMutation, GrpcModifyAttributeSchemaTypeMutation, GrpcRemoveAttributeSchemaMutation,
    GrpcSetAttributeSchemaFilterableMutation,
    GrpcSetAttributeSchemaGloballyUniqueMutation, GrpcSetAttributeSchemaLocalizedMutation,
    GrpcSetAttributeSchemaNullableMutation, GrpcSetAttributeSchemaRepresentativeMutation,
    GrpcSetAttributeSchemaSortableMutation, GrpcSetAttributeSchemaUniqueMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAttributeSchemaMutations_pb.ts'
import {
    CreateGlobalAttributeSchemaMutation
} from '@/modules/database-driver/request-response/cdc/CreateGlobalAttributeSchemaMutation.ts'
import type { ScopesConverter } from '@/modules/database-driver/connector/grpc/service/converter/ScopesConverter.ts'
import {
    ModifyAttributeSchemaDefaultValueMutation
} from '@/modules/database-driver/request-response/cdc/ModifyAttributeSchemaDefaultValueMutation.ts'
import {
    ModifyAttributeSchemaDeprecationNoticeMutation
} from '@/modules/database-driver/request-response/cdc/ModifyAttributeSchemaDeprecationNoticeMutation.ts'
import {
    ModifyAttributeSchemaDescriptionMutation
} from '@/modules/database-driver/request-response/cdc/ModifyAttributeSchemaDescriptionMutation.ts'
import {
    ModifyAttributeSchemaNameMutation
} from '@/modules/database-driver/request-response/cdc/ModifyAttributeSchemaNameMutation.ts'
import {
    ModifyAttributeSchemaTypeMutation
} from '@/modules/database-driver/request-response/cdc/ModifyAttributeSchemaTypeMutation.ts'
import {
    RemoveAttributeSchemaMutation
} from '@/modules/database-driver/request-response/cdc/RemoveAttributeSchemaMutation.ts'
import {
    SetAttributeSchemaFilterableMutation
} from '@/modules/database-driver/request-response/cdc/SetAttributeSchemaFilterableMutation.ts'
import {
    SetAttributeSchemaLocalizedMutation
} from '@/modules/database-driver/request-response/cdc/SetAttributeSchemaLocalizedMutation.ts'
import {
    SetAttributeSchemaNullableMutation
} from '@/modules/database-driver/request-response/cdc/SetAttributeSchemaNullableMutation.ts'
import {
    SetAttributeSchemaRepresentativeMutation
} from '@/modules/database-driver/request-response/cdc/SetAttributeSchemaRepresentativeMutation.ts'
import {
    SetAttributeSchemaSortableMutation
} from '@/modules/database-driver/request-response/cdc/SetAttributeSchemaSortableMutation.ts'
import {
    SetAttributeSchemaUniqueMutation
} from '@/modules/database-driver/request-response/cdc/SetAttributeSchemaUniqueMutation.ts'
import {
    SetAttributeSchemaGloballyUniqueMutation
} from '@/modules/database-driver/request-response/cdc/SetAttributeSchemaGloballyUniqueMutation.ts'
import type {
    GrpcCreateEntitySchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEntitySchemaMutations_pb.ts'
import {
    CreateEntitySchemaMutation
} from '@/modules/database-driver/request-response/cdc/CreateEntitySchemaMutation.ts'
import type {
    ModifyEntitySchemaMutation
} from '@/modules/database-driver/request-response/cdc/ModifyEntitySchemaMutation.ts'

export class LocalCatalogSchemaMutationConverter {
    private readonly catalogEvolutionModeConverter: CatalogEvolutionModeConverter
    private readonly scopesConvertor: ScopesConverter

    constructor(catalogEvolutionModeConverter: CatalogEvolutionModeConverter, scopesConvertor: ScopesConverter) {
        this.catalogEvolutionModeConverter = catalogEvolutionModeConverter
        this.scopesConvertor = scopesConvertor
    }

    convertLocalCatalogSchemaMutations(mutations: GrpcLocalCatalogSchemaMutation[]): ImmutableList<LocalCatalogSchemaMutation> {

    }

    convertLocaleCatalogSchemaMutation(mutation: GrpcLocalCatalogSchemaMutation): LocalCatalogSchemaMutation {
        switch (mutation.mutation.case) {
            case 'modifyCatalogSchemaDescriptionMutation':
                return this.convertModifyCatalogSchemaDescriptionMutation(mutation.mutation.value)
            case 'allowEvolutionModeInCatalogSchemaMutation':
                return this.convertAllowEvolutionModeInCatalogSchemaMutation(mutation.mutation.value)
            case 'disallowEvolutionModeInCatalogSchemaMutation':
                return this.convertDisallowEvolutionModeInCatalogSchemaMutation(mutation.mutation.value)
            case 'createGlobalAttributeSchemaMutation':
                return this.convertCreateGlobalAttributeSchemaMutation(mutation.mutation.value)
            case 'modifyAttributeSchemaDefaultValueMutation':
                return this.convertModifyAttributeSchemaDefaultValueMutation(mutation.mutation.value)
            case 'modifyAttributeSchemaDeprecationNoticeMutation':
                return this.convertAttributeSchemaDeprecationNoticeMutation(mutation.mutation.value)
            case 'modifyAttributeSchemaDescriptionMutation':
                return this.convertModifyAttributeSchemaDescriptionMutation(mutation.mutation.value)
            case 'modifyAttributeSchemaNameMutation':
                return this.convertModifyAttributeSchemaNameMutation(mutation.mutation.value)
            case 'modifyAttributeSchemaTypeMutation':
                return this.convertModifyAttributeSchemaTypeMutation(mutation.mutation.value)
            case 'removeAttributeSchemaMutation':
                return this.convertRemoveAttributeSchemaMutation(mutation.mutation.value)
            case 'setAttributeSchemaFilterableMutation':
                return this.convertSetAttributeSchemaFilterableMutation(mutation.mutation.value)
            case 'setAttributeSchemaLocalizedMutation':
                return this.convertSetAttributeSchemaLocalizedMutation(mutation.mutation.value)
            case 'setAttributeSchemaNullableMutation':
                return this.convertSetAttributeSchemaNullableMutation(mutation.mutation.value)
            case 'setAttributeSchemaRepresentativeMutation':
                return this.convertSetAttributeSchemaRepresentativeMutation(mutation.mutation.value)
            case 'setAttributeSchemaSortableMutation':
                return this.convertSetAttributeSchemaSortableMutation(mutation.mutation.value)
            case 'setAttributeSchemaUniqueMutation':
                return this.convertSetAttributeSchemaUniqueMutation(mutation.mutation.value)
            case 'setAttributeSchemaGloballyUniqueMutation':
                return this.convertSetAttributeSchemaGloballyUniqueMutation(mutation.mutation.value)
            case 'createEntitySchemaMutation':
                return this.convertCreateEntitySchemaMutation(mutation.mutation.value)
            case 'modifyEntitySchemaMutation':
                // TODO: handle modifyEntitySchemaMutation
                break;
            case 'modifyEntitySchemaNameMutation':
                // TODO: handle modifyEntitySchemaNameMutation
                break;
            case 'removeEntitySchemaMutation':
                // TODO: handle removeEntitySchemaMutation
                break;
            case undefined:
                // TODO: handle undefined
                break;
            default:
                // Optional: handle unexpected cases
                break;
        }
    }

    private convertModifyCatalogSchemaDescriptionMutation(modifyCatalogSchemaDescriptionMutation: GrpcModifyCatalogSchemaDescriptionMutation): ModifyCatalogSchemaDescriptionMutation {
        return new ModifyCatalogSchemaDescriptionMutation(modifyCatalogSchemaDescriptionMutation.description)
    }

    private convertAllowEvolutionModeInCatalogSchemaMutation(allowEvolutionModeInCatalogSchemaMutation: GrpcAllowEvolutionModeInCatalogSchemaMutation): AllowEvolutionModeInCatalogSchemaMutation {
        return new AllowEvolutionModeInCatalogSchemaMutation(this.catalogEvolutionModeConverter.convertCatalogEvolutionModes(allowEvolutionModeInCatalogSchemaMutation.evolutionModes))
    }

    private convertDisallowEvolutionModeInCatalogSchemaMutation(disallowEvolutionModeInCatalogSchemaMutation: GrpcDisallowEvolutionModeInCatalogSchemaMutation): DisallowEvolutionModeInCatalogSchemaMutation {
        return new DisallowEvolutionModeInCatalogSchemaMutation(this.catalogEvolutionModeConverter.convertCatalogEvolutionModes(disallowEvolutionModeInCatalogSchemaMutation.evolutionModes))
    }

    private convertCreateGlobalAttributeSchemaMutation(createGlobalAttributeSchemaMutation: GrpcCreateGlobalAttributeSchemaMutation): CreateGlobalAttributeSchemaMutation {
        return new CreateGlobalAttributeSchemaMutation(
            createGlobalAttributeSchemaMutation.name,
            createGlobalAttributeSchemaMutation.description,
            createGlobalAttributeSchemaMutation.deprecationNotice,
            createGlobalAttributeSchemaMutation.localized,
            createGlobalAttributeSchemaMutation.nullable,
            createGlobalAttributeSchemaMutation.representative,
            createGlobalAttributeSchemaMutation.type.toString(),
            createGlobalAttributeSchemaMutation.indexedDecimalPlaces,
            createGlobalAttributeSchemaMutation.defaultValue,
            this.scopesConvertor.convertUniqueInScopes(createGlobalAttributeSchemaMutation.uniqueInScopes),
            this.scopesConvertor.convertEntityScopes(createGlobalAttributeSchemaMutation.filterableInScopes),
            this.scopesConvertor.convertEntityScopes(createGlobalAttributeSchemaMutation.sortableInScopes)
        )
    }

    private convertModifyAttributeSchemaDefaultValueMutation(modifyAttributeSchemaDefaultValueMutation: GrpcModifyAttributeSchemaDefaultValueMutation): ModifyAttributeSchemaDefaultValueMutation {
        return new ModifyAttributeSchemaDefaultValueMutation(
            modifyAttributeSchemaDefaultValueMutation.name,
            modifyAttributeSchemaDefaultValueMutation.defaultValue
        )
    }

    private convertAttributeSchemaDeprecationNoticeMutation(attributeSchemaDeprecationNoticeMutation: GrpcModifyAttributeSchemaDeprecationNoticeMutation): ModifyAttributeSchemaDeprecationNoticeMutation {
        return new ModifyAttributeSchemaDeprecationNoticeMutation(
            attributeSchemaDeprecationNoticeMutation.name,
            attributeSchemaDeprecationNoticeMutation.deprecationNotice
        )
    }

    private convertModifyAttributeSchemaDescriptionMutation(modifyAttributeSchemaDescriptionMutation: GrpcModifyAttributeSchemaDescriptionMutation): ModifyAttributeSchemaDescriptionMutation {
        return new ModifyAttributeSchemaDescriptionMutation(
            modifyAttributeSchemaDescriptionMutation.name,
            modifyAttributeSchemaDescriptionMutation.description,
        )
    }

    private convertModifyAttributeSchemaNameMutation(modifyAttributeSchemaNameMutation: GrpcModifyAttributeSchemaNameMutation): ModifyAttributeSchemaNameMutation {
        return new ModifyAttributeSchemaNameMutation(
            modifyAttributeSchemaNameMutation.name,
            modifyAttributeSchemaNameMutation.newName
        )
    }

    private convertModifyAttributeSchemaTypeMutation(modifyAttributeSchemaTypeMutation: GrpcModifyAttributeSchemaTypeMutation): ModifyAttributeSchemaTypeMutation {
        return new ModifyAttributeSchemaTypeMutation(
            modifyAttributeSchemaTypeMutation.name,
            modifyAttributeSchemaTypeMutation.type,
            modifyAttributeSchemaTypeMutation.indexedDecimalPlaces
        )
    }

    private convertRemoveAttributeSchemaMutation(removeAttributeSchemaMutation: GrpcRemoveAttributeSchemaMutation): RemoveAttributeSchemaMutation {
        return new RemoveAttributeSchemaMutation(
            removeAttributeSchemaMutation.name
        )
    }

    private convertSetAttributeSchemaFilterableMutation(setAttributeSchemaFilterableMutation: GrpcSetAttributeSchemaFilterableMutation): SetAttributeSchemaFilterableMutation {
        return new SetAttributeSchemaFilterableMutation(
            setAttributeSchemaFilterableMutation.name,
            this.scopesConvertor.convertEntityScopes(setAttributeSchemaFilterableMutation.filterableInScopes)
        )
    }

    private convertSetAttributeSchemaLocalizedMutation(setAttributeSchemaLocalizedMutation: GrpcSetAttributeSchemaLocalizedMutation): SetAttributeSchemaLocalizedMutation {
        return new SetAttributeSchemaLocalizedMutation(
            setAttributeSchemaLocalizedMutation.name,
            setAttributeSchemaLocalizedMutation.localized
        )
    }

    private convertSetAttributeSchemaNullableMutation(setAttributeSchemaNullableMutation: GrpcSetAttributeSchemaNullableMutation): SetAttributeSchemaNullableMutation {
        return new SetAttributeSchemaNullableMutation(
            setAttributeSchemaNullableMutation.name,
            setAttributeSchemaNullableMutation.nullable
        )
    }

    private convertSetAttributeSchemaRepresentativeMutation(setAttributeSchemaRepresentativeMutation: GrpcSetAttributeSchemaRepresentativeMutation): SetAttributeSchemaRepresentativeMutation {
        return new SetAttributeSchemaRepresentativeMutation(
            setAttributeSchemaRepresentativeMutation.name,
            setAttributeSchemaRepresentativeMutation.representative
        )
    }

    private convertSetAttributeSchemaSortableMutation(setAttributeSchemaSortableMutation: GrpcSetAttributeSchemaSortableMutation): SetAttributeSchemaSortableMutation {
        return new SetAttributeSchemaSortableMutation(
            setAttributeSchemaSortableMutation.name,
            this.scopesConvertor.convertEntityScopes(setAttributeSchemaSortableMutation.sortableInScopes)
        )
    }

    private convertSetAttributeSchemaUniqueMutation(setAttributeSchemaUniqueMutation: GrpcSetAttributeSchemaUniqueMutation): SetAttributeSchemaUniqueMutation {
        return new SetAttributeSchemaUniqueMutation(
            setAttributeSchemaUniqueMutation.name,
            this.scopesConvertor.convertUniqueInScopes(setAttributeSchemaUniqueMutation.uniqueInScopes)
        )
    }

    private convertSetAttributeSchemaGloballyUniqueMutation(setAttributeSchemaGloballyUniqueMutation: GrpcSetAttributeSchemaGloballyUniqueMutation): SetAttributeSchemaGloballyUniqueMutation {
        return new SetAttributeSchemaGloballyUniqueMutation(
            setAttributeSchemaGloballyUniqueMutation.name,
            this.scopesConvertor.convertScopedGlobalAttributeUniquenessTypes(setAttributeSchemaGloballyUniqueMutation.uniqueGloballyInScopes)
        )
    }

    private convertCreateEntitySchemaMutation(createEntitySchemaMutation: GrpcCreateEntitySchemaMutation): CreateEntitySchemaMutation {
        return new CreateEntitySchemaMutation(
            createEntitySchemaMutation.entityType
        )
    }

    private convertModifyEntitySchemaMutation(modifyEntitySchemaMutation: GrpcModifyEntitySchemaMutation): ModifyEntitySchemaMutation {
        return new ModifyEntitySchemaMutation(
            modifyEntitySchemaMutation.entityType,
            modifyEntitySchemaMutation.entitySchemaMutations
        )
    }
}
