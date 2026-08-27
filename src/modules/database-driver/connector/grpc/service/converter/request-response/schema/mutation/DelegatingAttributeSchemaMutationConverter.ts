import type {
    MutationConverterRegistry
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/mutation/MutationConverterRegistry.ts'
import {
    mutationConverterRegistry
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/mutation/MutationConverterRegistry.ts'
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
    SetAttributeSchemaUniqueMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/SetAttributeSchemaUniqueMutationConverter.ts'
import {
    UseGlobalAttributeSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/UseGlobalAttributeSchemaMutationConverter.ts'
import {
    UnknownSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/UnknownSchemaMutation.ts'
import {
    ModifyAttributeSchemaDescriptionMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/ModifyAttributeSchemaDescriptionMutationConverter.ts'
import type {
    GrpcSortableAttributeCompoundSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcSortableAttributeCompoundSchemaMutations_pb.ts'
import type {
    SortableAttributeCompoundSchemaMutation
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/SortableAttributeCompoundSchemaMutation.ts'

import {
    SetAttributeSchemaConflictResolutionOverrideMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/SetAttributeSchemaConflictResolutionOverrideMutationConverter.ts'

export class DelegatingAttributeSchemaMutationConverter {

    private static converters: MutationConverterRegistry<SortableAttributeCompoundSchemaMutation> | undefined

    /**
     * The registry is built on first use rather than during class initialisation: nested mutation
     * converters import this class back (a reference mutation contains attribute mutations, an entity
     * mutation contains an entity-schema mutation, …), and with a statically initialised map the
     * entry for whichever module the bundler happens to evaluate first would capture `undefined`.
     */
    private static registry(): MutationConverterRegistry<SortableAttributeCompoundSchemaMutation> {
        if (DelegatingAttributeSchemaMutationConverter.converters == undefined) {
            DelegatingAttributeSchemaMutationConverter.converters = mutationConverterRegistry<SortableAttributeCompoundSchemaMutation>([
                ['createAttributeSchemaMutation',
                    CreateAttributeSchemaMutationConverter.INSTANCE
                ],
                ['setAttributeSchemaConflictResolutionOverrideMutation',
                    SetAttributeSchemaConflictResolutionOverrideMutationConverter.INSTANCE
                ],
                ['modifyAttributeSchemaDefaultValueMutation',
                    ModifyAttributeSchemaDefaultValueMutationConverter.INSTANCE
                ],
                ['modifyAttributeSchemaDeprecationNoticeMutation',
                    ModifyAttributeSchemaDeprecationNoticeMutationConverter.INSTANCE
                ],
                ['modifyAttributeSchemaDescriptionMutation',
                    ModifyAttributeSchemaDescriptionMutationConverter.INSTANCE
                ],
                ['modifyAttributeSchemaNameMutation',
                    ModifyAttributeSchemaNameMutationConverter.INSTANCE
                ],
                ['modifyAttributeSchemaTypeMutation',
                    ModifyAttributeSchemaTypeMutationConverter.INSTANCE
                ],
                ['removeAttributeSchemaMutation',
                    RemoveAttributeSchemaMutationConverter.INSTANCE
                ],
                ['setAttributeSchemaFilterableMutation',
                    SetAttributeSchemaFilterableMutationConverter.INSTANCE
                ],
                ['setAttributeSchemaLocalizedMutation',
                    SetAttributeSchemaLocalizedMutationConverter.INSTANCE
                ],
                ['setAttributeSchemaNullableMutation',
                    SetAttributeSchemaNullableMutationConverter.INSTANCE
                ],
                ['setAttributeSchemaRepresentativeMutation',
                    SetAttributeSchemaRepresentativeMutationConverter.INSTANCE
                ],
                ['setAttributeSchemaSortableMutation',
                    SetAttributeSchemaSortableMutationConverter.INSTANCE
                ],
                ['setAttributeSchemaUniqueMutation',
                    SetAttributeSchemaUniqueMutationConverter.INSTANCE
                ],
                ['useGlobalAttributeSchemaMutation',
                    UseGlobalAttributeSchemaMutationConverter.INSTANCE
                ]
            ])
        }
        return DelegatingAttributeSchemaMutationConverter.converters
    }

    /**
     * Converts a nested gRPC attribute schema mutation to its internal counterpart.
     *
     * Never throws: this runs on the CDC path, where the mutation that contains this one carries the
     * catalog name the schema-cache eviction depends on. An unconvertible nested mutation therefore
     * degrades to {@link UnknownSchemaMutation} instead of discarding the containing mutation.
     */
    static convert(mutation: GrpcSortableAttributeCompoundSchemaMutation|undefined): SortableAttributeCompoundSchemaMutation {
        if (!mutation?.mutation?.case) {
            // proto3 dropped a branch this client does not know - expected version skew with a newer server
            console.warn('Unknown attribute schema mutation dropped (unset oneof case); degrading to an unknown mutation.')
            return new UnknownSchemaMutation(undefined)
        }

        const converter = DelegatingAttributeSchemaMutationConverter.registry().get(mutation.mutation.case)
        if (!converter) {
            // a known branch with no registered converter - a forgotten registry entry, visible in dev
            console.warn(`No converter registered for attribute schema mutation '${mutation.mutation.case}'; degrading to an unknown mutation.`)
            return new UnknownSchemaMutation(mutation.mutation.case)
        }

        return converter.convert(mutation.mutation.value)
    }
}

