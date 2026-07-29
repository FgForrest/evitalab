import { describe, test, expect, vi, afterEach } from 'vitest'
import {
    DelegatingLocalCatalogSchemaMutationConverter
} from '../../../../../../../src/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/DelegatingLocalCatalogSchemaMutationConverter'
import {
    DelegatingEntitySchemaMutationConverter
} from '../../../../../../../src/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/DelegatingEntitySchemaMutationConverter'
import {
    DelegatingAttributeSchemaMutationConverter
} from '../../../../../../../src/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/DelegatingAttributeSchemaMutationConverter'
import {
    ModifyCatalogSchemaMutationConverter
} from '../../../../../../../src/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/engine/ModifyCatalogSchemaMutationConverter'
import {
    UnknownSchemaMutation
} from '../../../../../../../src/modules/database-driver/request-response/schema/mutation/UnknownSchemaMutation'
import {
    ModifyCatalogSchemaConflictResolutionMutation
} from '../../../../../../../src/modules/database-driver/request-response/schema/mutation/catalog/ModifyCatalogSchemaConflictResolutionMutation'
import {
    ModifyEntitySchemaConflictResolutionMutation
} from '../../../../../../../src/modules/database-driver/request-response/schema/mutation/entity/ModifyEntitySchemaConflictResolutionMutation'
import {
    SetAttributeSchemaConflictResolutionOverrideMutation
} from '../../../../../../../src/modules/database-driver/request-response/schema/mutation/attribute/SetAttributeSchemaConflictResolutionOverrideMutation'
import {
    SetAssociatedDataSchemaConflictResolutionOverrideMutation
} from '../../../../../../../src/modules/database-driver/request-response/schema/mutation/associatedData/SetAssociatedDataSchemaConflictResolutionOverrideMutation'
import {
    SetReferenceSchemaConflictResolutionOverrideMutation
} from '../../../../../../../src/modules/database-driver/request-response/schema/mutation/reference/SetReferenceSchemaConflictResolutionOverrideMutation'
import { ConflictPolicy } from '../../../../../../../src/modules/database-driver/request-response/schema/ConflictPolicy'
import {
    ConflictResolutionOverride
} from '../../../../../../../src/modules/database-driver/request-response/schema/ConflictResolutionOverride'
import {
    GrpcConflictPolicy,
    GrpcConflictResolutionOverride,
    GrpcGranularConflictPolicy
} from '../../../../../../../src/modules/database-driver/connector/grpc/gen/GrpcEnums_pb'
import {
    GranularConflictPolicy
} from '../../../../../../../src/modules/database-driver/request-response/schema/GranularConflictPolicy'
import type {
    GrpcLocalCatalogSchemaMutation
} from '../../../../../../../src/modules/database-driver/connector/grpc/gen/GrpcCatalogSchemaMutation_pb'
import type {
    GrpcEntitySchemaMutation
} from '../../../../../../../src/modules/database-driver/connector/grpc/gen/GrpcEntitySchemaMutation_pb'
import type {
    GrpcModifyCatalogSchemaMutation
} from '../../../../../../../src/modules/database-driver/connector/grpc/gen/GrpcEngineMutation_pb'

// the delegating converters only read `mutation.mutation.{case,value}`, so a plain object suffices
function localCatalogMutation(mutationCase: string | undefined, value: unknown = {}): GrpcLocalCatalogSchemaMutation {
    return { mutation: { case: mutationCase, value } } as unknown as GrpcLocalCatalogSchemaMutation
}

function entityMutation(mutationCase: string | undefined, value: unknown = {}): GrpcEntitySchemaMutation {
    return { mutation: { case: mutationCase, value } } as unknown as GrpcEntitySchemaMutation
}

afterEach(() => {
    vi.restoreAllMocks()
})

describe('nested schema mutation conversion is lenient', () => {
    test('an unset oneof case degrades to an unknown mutation instead of throwing', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {})

        const catalogLevel = DelegatingLocalCatalogSchemaMutationConverter.convert(localCatalogMutation(undefined))
        expect(catalogLevel).toBeInstanceOf(UnknownSchemaMutation)
        expect((catalogLevel as UnknownSchemaMutation).mutationCase).toBeUndefined()

        expect(DelegatingEntitySchemaMutationConverter.convert(entityMutation(undefined)))
            .toBeInstanceOf(UnknownSchemaMutation)
        expect(DelegatingAttributeSchemaMutationConverter.convert(undefined))
            .toBeInstanceOf(UnknownSchemaMutation)
    })

    test('a known case with no registered converter degrades and names the case', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {})

        const converted = DelegatingEntitySchemaMutationConverter.convert(
            entityMutation('someMutationThisClientDoesNotHandleYet')
        )
        expect(converted).toBeInstanceOf(UnknownSchemaMutation)
        expect((converted as UnknownSchemaMutation).mutationCase)
            .toBe('someMutationThisClientDoesNotHandleYet')
    })

    test('an unconvertible nested mutation never discards the mutation that contains it', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {})

        // this is what CDC cache eviction depends on: the catalog name must survive a nested mutation
        // the client cannot convert, otherwise the schema caches are never cleared
        const converted = ModifyCatalogSchemaMutationConverter.INSTANCE.convert({
            catalogName: 'testCatalog',
            schemaMutations: [
                localCatalogMutation('modifyCatalogSchemaConflictResolutionMutation', {
                    conflictResolution: { policy: GrpcConflictPolicy.CONFLICT_POLICY_ENTITY, granularity: [] }
                }),
                localCatalogMutation('aMutationFromANewerServer')
            ]
        } as unknown as GrpcModifyCatalogSchemaMutation)

        expect(converted.catalogName).toBe('testCatalog')
        // the count stays honest - the unknown mutation is represented, not dropped
        expect(converted.schemaMutations.size).toBe(2)
        expect(converted.schemaMutations.get(0)).toBeInstanceOf(ModifyCatalogSchemaConflictResolutionMutation)
        expect(converted.schemaMutations.get(1)).toBeInstanceOf(UnknownSchemaMutation)
    })
})

describe('conflict resolution schema mutations are converted', () => {
    test('a catalog-level conflict resolution mutation', () => {
        const converted = DelegatingLocalCatalogSchemaMutationConverter.convert(
            localCatalogMutation('modifyCatalogSchemaConflictResolutionMutation', {
                conflictResolution: {
                    policy: GrpcConflictPolicy.CONFLICT_POLICY_COLLECTION,
                    granularity: []
                }
            })
        ) as ModifyCatalogSchemaConflictResolutionMutation

        expect(converted).toBeInstanceOf(ModifyCatalogSchemaConflictResolutionMutation)
        expect(converted.conflictResolution?.policy).toBe(ConflictPolicy.Collection)
    })

    test('a cleared catalog-level conflict resolution keeps its absence', () => {
        const converted = DelegatingLocalCatalogSchemaMutationConverter.convert(
            localCatalogMutation('modifyCatalogSchemaConflictResolutionMutation', { conflictResolution: undefined })
        ) as ModifyCatalogSchemaConflictResolutionMutation

        expect(converted.conflictResolution).toBeUndefined()
    })

    test('an entity-level conflict resolution mutation including its refinements', () => {
        const converted = DelegatingEntitySchemaMutationConverter.convert(
            entityMutation('modifyEntitySchemaConflictResolutionMutation', {
                conflictResolution: {
                    policy: GrpcConflictPolicy.CONFLICT_POLICY_ENTITY,
                    granularity: [GrpcGranularConflictPolicy.GRANULAR_CONFLICT_POLICY_ENTITY_ATTRIBUTE]
                }
            })
        ) as ModifyEntitySchemaConflictResolutionMutation

        expect(converted).toBeInstanceOf(ModifyEntitySchemaConflictResolutionMutation)
        expect(converted.conflictResolution?.policy).toBe(ConflictPolicy.Entity)
        expect(converted.conflictResolution?.granularity.toArray())
            .toEqual([GranularConflictPolicy.EntityAttribute])
    })

    test.each([
        ['setAttributeSchemaConflictResolutionOverrideMutation', SetAttributeSchemaConflictResolutionOverrideMutation],
        ['setAssociatedDataSchemaConflictResolutionOverrideMutation', SetAssociatedDataSchemaConflictResolutionOverrideMutation],
        ['setReferenceSchemaConflictResolutionOverrideMutation', SetReferenceSchemaConflictResolutionOverrideMutation]
    ])('the per-item override mutation %s', (mutationCase, expectedClass) => {
        const converted = DelegatingEntitySchemaMutationConverter.convert(
            entityMutation(mutationCase, {
                name: 'code',
                conflictResolutionOverride: GrpcConflictResolutionOverride.CONFLICT_RESOLUTION_OVERRIDE_GRANULAR
            })
        ) as SetAttributeSchemaConflictResolutionOverrideMutation

        expect(converted).toBeInstanceOf(expectedClass)
        expect(converted.name).toBe('code')
        expect(converted.conflictResolutionOverride).toBe(ConflictResolutionOverride.Granular)
    })

    test('a reference attribute override nested under a reference', () => {
        const converted = DelegatingAttributeSchemaMutationConverter.convert(
            {
                mutation: {
                    case: 'setAttributeSchemaConflictResolutionOverrideMutation',
                    value: {
                        name: 'priority',
                        conflictResolutionOverride: GrpcConflictResolutionOverride.CONFLICT_RESOLUTION_OVERRIDE_ENTITY
                    }
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- structural stub of a grpc oneof wrapper
            } as any
        ) as SetAttributeSchemaConflictResolutionOverrideMutation

        expect(converted).toBeInstanceOf(SetAttributeSchemaConflictResolutionOverrideMutation)
        expect(converted.conflictResolutionOverride).toBe(ConflictResolutionOverride.Entity)
    })
})
