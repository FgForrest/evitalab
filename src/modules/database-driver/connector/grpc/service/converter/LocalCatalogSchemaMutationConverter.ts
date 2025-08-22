//todo: lho
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

export class LocalCatalogSchemaMutationConverter {
    private readonly catalogEvolutionModeConverter: CatalogEvolutionModeConverter
    private readonly scopesConvertor: ScopesConverter
    private readonly modifyAttributeSchemaConverter: ModifyAttributeSchemaConverter
    private readonly removeAttributeSchemaConverter: RemoveAttributeSchemaConverter
    private readonly setAttributeSchemaConverter: SetAttributeSchemaConverter
    private readonly createEntitySchemaConverter: CreateEntitySchemaConverter

    constructor(catalogEvolutionModeConverter: CatalogEvolutionModeConverter, scopesConvertor: ScopesConverter, modifyAttributeSchemaConverter: ModifyAttributeSchemaConverter, removeAttributeSchemaConverter: RemoveAttributeSchemaConverter, setAttributeSchemaConverter: SetAttributeSchemaConverter, createEntitySchemaConverter: CreateEntitySchemaConverter) {
        this.catalogEvolutionModeConverter = catalogEvolutionModeConverter
        this.scopesConvertor = scopesConvertor
        this.modifyAttributeSchemaConverter = modifyAttributeSchemaConverter
        this.removeAttributeSchemaConverter = removeAttributeSchemaConverter
        this.setAttributeSchemaConverter = setAttributeSchemaConverter
        this.createEntitySchemaConverter = createEntitySchemaConverter
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
                return this.modifyAttributeSchemaConverter.convertModifyAttributeSchemaDefaultValueMutation(mutation.mutation.value)
            case 'modifyAttributeSchemaDeprecationNoticeMutation':
                return this.modifyAttributeSchemaConverter.convertAttributeSchemaDeprecationNoticeMutation(mutation.mutation.value)
            case 'modifyAttributeSchemaDescriptionMutation':
                return this.modifyAttributeSchemaConverter.convertModifyAttributeSchemaDescriptionMutation(mutation.mutation.value)
            case 'modifyAttributeSchemaNameMutation':
                return this.modifyAttributeSchemaConverter.convertModifyAttributeSchemaNameMutation(mutation.mutation.value)
            case 'modifyAttributeSchemaTypeMutation':
                return this.modifyAttributeSchemaConverter.convertModifyAttributeSchemaTypeMutation(mutation.mutation.value)
            case 'removeAttributeSchemaMutation':
                return this.removeAttributeSchemaConverter.convertRemoveAttributeSchemaMutation(mutation.mutation.value)
            case 'setAttributeSchemaFilterableMutation':
                return this.setAttributeSchemaConverter.convertSetAttributeSchemaFilterableMutation(mutation.mutation.value)
            case 'setAttributeSchemaLocalizedMutation':
                return this.setAttributeSchemaConverter.convertSetAttributeSchemaLocalizedMutation(mutation.mutation.value)
            case 'setAttributeSchemaNullableMutation':
                return this.setAttributeSchemaConverter.convertSetAttributeSchemaNullableMutation(mutation.mutation.value)
            case 'setAttributeSchemaRepresentativeMutation':
                return this.setAttributeSchemaConverter.convertSetAttributeSchemaRepresentativeMutation(mutation.mutation.value)
            case 'setAttributeSchemaSortableMutation':
                return this.setAttributeSchemaConverter.convertSetAttributeSchemaSortableMutation(mutation.mutation.value)
            case 'setAttributeSchemaUniqueMutation':
                return this.setAttributeSchemaConverter.convertSetAttributeSchemaUniqueMutation(mutation.mutation.value)
            case 'setAttributeSchemaGloballyUniqueMutation':
                return this.setAttributeSchemaConverter.convertSetAttributeSchemaGloballyUniqueMutation(mutation.mutation.value)
            case 'createEntitySchemaMutation':
                return this.createEntitySchemaConverter.convertCreateEntitySchemaMutation(mutation.mutation.value)
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

    private convertModifyEntitySchemaMutation(modifyEntitySchemaMutation: GrpcModifyEntitySchemaMutation): ModifyEntitySchemaMutation {
        return new ModifyEntitySchemaMutation(
            modifyEntitySchemaMutation.entityType,
            modifyEntitySchemaMutation.entitySchemaMutations,

        )
    }
}
