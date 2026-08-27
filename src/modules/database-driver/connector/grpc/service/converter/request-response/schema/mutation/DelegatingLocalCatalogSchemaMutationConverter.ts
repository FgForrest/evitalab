import type {
    MutationConverterRegistry
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/mutation/MutationConverterRegistry.ts'
import {
    mutationConverterRegistry
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/mutation/MutationConverterRegistry.ts'
import {
    UnknownSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/UnknownSchemaMutation.ts'
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

import {
    ModifyCatalogSchemaConflictResolutionMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/catalog/ModifyCatalogSchemaConflictResolutionMutationConverter.ts'
import {
    SetAttributeSchemaConflictResolutionOverrideMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/SetAttributeSchemaConflictResolutionOverrideMutationConverter.ts'
export class DelegatingLocalCatalogSchemaMutationConverter {

    private static converters: MutationConverterRegistry<LocalCatalogSchemaMutation> | undefined

    /**
     * The registry is built on first use rather than during class initialisation: nested mutation
     * converters import this class back (a reference mutation contains attribute mutations, an entity
     * mutation contains an entity-schema mutation, …), and with a statically initialised map the
     * entry for whichever module the bundler happens to evaluate first would capture `undefined`.
     */
    private static registry(): MutationConverterRegistry<LocalCatalogSchemaMutation> {
        if (DelegatingLocalCatalogSchemaMutationConverter.converters == undefined) {
            DelegatingLocalCatalogSchemaMutationConverter.converters = mutationConverterRegistry<LocalCatalogSchemaMutation>([
                // attribute schema mutations
                ['createGlobalAttributeSchemaMutation', CreateGlobalAttributeSchemaMutationConverter.INSTANCE],
                ['modifyCatalogSchemaConflictResolutionMutation', ModifyCatalogSchemaConflictResolutionMutationConverter.INSTANCE],
                ['setAttributeSchemaConflictResolutionOverrideMutation', SetAttributeSchemaConflictResolutionOverrideMutationConverter.INSTANCE],
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
            ])
        }
        return DelegatingLocalCatalogSchemaMutationConverter.converters
    }

    /**
     * Converts a nested gRPC local catalog schema mutation to its internal counterpart.
     *
     * Never throws: this runs on the CDC path, where the mutation that contains this one carries the
     * catalog name the schema-cache eviction depends on. An unconvertible nested mutation therefore
     * degrades to {@link UnknownSchemaMutation} instead of discarding the containing mutation.
     */
    static convert(mutation: GrpcLocalCatalogSchemaMutation | undefined): LocalCatalogSchemaMutation {
        if (!mutation?.mutation?.case) {
            // proto3 dropped a branch this client does not know - expected version skew with a newer server
            console.warn('Unknown local catalog schema mutation dropped (unset oneof case); degrading to an unknown mutation.')
            return new UnknownSchemaMutation(undefined)
        }

        const converter = DelegatingLocalCatalogSchemaMutationConverter.registry().get(mutation.mutation.case)
        if (!converter) {
            // a known branch with no registered converter - a forgotten registry entry, visible in dev
            console.warn(`No converter registered for local catalog schema mutation '${mutation.mutation.case}'; degrading to an unknown mutation.`)
            return new UnknownSchemaMutation(mutation.mutation.case)
        }

        return converter.convert(mutation.mutation.value)
    }
}

