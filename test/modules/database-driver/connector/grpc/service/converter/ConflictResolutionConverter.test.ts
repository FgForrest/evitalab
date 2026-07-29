import { describe, test, expect } from 'vitest'
import {
    ConflictResolutionConverter
} from '../../../../../../../src/modules/database-driver/connector/grpc/service/converter/ConflictResolutionConverter'
import {
    CatalogSchemaConverter
} from '../../../../../../../src/modules/database-driver/connector/grpc/service/converter/CatalogSchemaConverter'
import {
    GrpcAttributeInheritanceBehavior,
    GrpcAttributeSchemaType,
    GrpcConflictPolicy,
    GrpcConflictResolutionOverride,
    GrpcEvitaAssociatedDataDataType_GrpcEvitaDataType,
    GrpcEvitaDataType,
    GrpcGranularConflictPolicy
} from '../../../../../../../src/modules/database-driver/connector/grpc/gen/GrpcEnums_pb'
import type {
    GrpcConflictResolution
} from '../../../../../../../src/modules/database-driver/connector/grpc/gen/GrpcEnums_pb'
import type {
    GrpcEntitySchema
} from '../../../../../../../src/modules/database-driver/connector/grpc/gen/GrpcEntitySchema_pb'
import type {
    GrpcCatalogSchema
} from '../../../../../../../src/modules/database-driver/connector/grpc/gen/GrpcCatalogSchema_pb'
import { ConflictPolicy } from '../../../../../../../src/modules/database-driver/request-response/schema/ConflictPolicy'
import { GranularConflictPolicy } from '../../../../../../../src/modules/database-driver/request-response/schema/GranularConflictPolicy'
import { ConflictResolutionOverride } from '../../../../../../../src/modules/database-driver/request-response/schema/ConflictResolutionOverride'
import { EntityAttributeSchema } from '../../../../../../../src/modules/database-driver/request-response/schema/EntityAttributeSchema'
import { GlobalAttributeSchema } from '../../../../../../../src/modules/database-driver/request-response/schema/GlobalAttributeSchema'
import { ReferenceAttributeSchema } from '../../../../../../../src/modules/database-driver/request-response/schema/ReferenceAttributeSchema'
import { ReflectedReferenceSchema } from '../../../../../../../src/modules/database-driver/request-response/schema/ReflectedReferenceSchema'
import type { EntitySchemaAccessor } from '../../../../../../../src/modules/database-driver/request-response/schema/EntitySchemaAccessor'
import { List } from 'immutable'

/**
 * Minimal grpc attribute schema stub - only the fields the converter reads are populated.
 */
function grpcAttribute(
    name: string,
    schemaType: GrpcAttributeSchemaType,
    conflictResolutionOverride: GrpcConflictResolutionOverride
) {
    return {
        name,
        schemaType,
        nameVariant: [],
        description: undefined,
        deprecationNotice: undefined,
        type: GrpcEvitaDataType.STRING,
        nullable: false,
        defaultValue: undefined,
        localized: false,
        indexedDecimalPlaces: 0,
        representative: false,
        sortableInScopes: [],
        filterableInScopes: [],
        uniqueInScopes: [],
        uniqueGloballyInScopes: [],
        conflictResolutionOverride
    }
}

function grpcConflictResolution(
    policy: GrpcConflictPolicy,
    granularity: GrpcGranularConflictPolicy[] = []
): GrpcConflictResolution {
    return { policy, granularity } as unknown as GrpcConflictResolution
}

function grpcEntitySchema(overrides: Record<string, unknown>): GrpcEntitySchema {
    return {
        version: 1,
        name: 'Product',
        nameVariant: [],
        description: undefined,
        deprecationNotice: undefined,
        withGeneratedPrimaryKey: true,
        withHierarchy: false,
        withPrice: false,
        indexedPricePlaces: 0,
        locales: [],
        currencies: [],
        evolutionMode: [],
        attributes: {},
        sortableAttributeCompounds: {},
        associatedData: {},
        references: {},
        conflictResolution: undefined,
        ...overrides
    } as unknown as GrpcEntitySchema
}

function grpcReferenceSchema(
    conflictResolutionOverride: GrpcConflictResolutionOverride,
    attributes: Record<string, unknown> = {}
) {
    return {
        name: 'master',
        nameVariant: [],
        description: undefined,
        deprecationNotice: undefined,
        entityType: 'Product',
        referencedEntityTypeManaged: true,
        entityTypeNameVariant: [],
        groupType: undefined,
        referencedGroupTypeManaged: undefined,
        groupTypeNameVariant: [],
        cardinality: 1,
        attributes,
        sortableAttributeCompounds: {},
        scopedIndexTypes: [],
        facetedInScopes: [],
        facetedPartially: [],
        bucketed: [],
        bucketedPartially: [],
        reflectedReferenceName: undefined,
        conflictResolutionOverride
    }
}

const converter = new CatalogSchemaConverter()
const noEntitySchemas: EntitySchemaAccessor = {
    getEntitySchemas: async () => List(),
    getEntitySchema: async () => undefined
}

describe('ConflictResolutionConverter enum mapping', () => {
    test.each([
        [GrpcConflictPolicy.CONFLICT_POLICY_NONE, ConflictPolicy.None],
        [GrpcConflictPolicy.CONFLICT_POLICY_CATALOG, ConflictPolicy.Catalog],
        [GrpcConflictPolicy.CONFLICT_POLICY_COLLECTION, ConflictPolicy.Collection],
        [GrpcConflictPolicy.CONFLICT_POLICY_ENTITY, ConflictPolicy.Entity]
    ])('maps coarse policy %s', (grpcPolicy, expected) => {
        expect(ConflictResolutionConverter.convertConflictPolicy(grpcPolicy)).toBe(expected)
    })

    test.each([
        [GrpcGranularConflictPolicy.GRANULAR_CONFLICT_POLICY_ENTITY_ATTRIBUTE, GranularConflictPolicy.EntityAttribute],
        [GrpcGranularConflictPolicy.GRANULAR_CONFLICT_POLICY_REFERENCE, GranularConflictPolicy.Reference],
        [GrpcGranularConflictPolicy.GRANULAR_CONFLICT_POLICY_REFERENCE_ATTRIBUTE, GranularConflictPolicy.ReferenceAttribute],
        [GrpcGranularConflictPolicy.GRANULAR_CONFLICT_POLICY_ASSOCIATED_DATA, GranularConflictPolicy.AssociatedData],
        [GrpcGranularConflictPolicy.GRANULAR_CONFLICT_POLICY_PRICE, GranularConflictPolicy.Price],
        [GrpcGranularConflictPolicy.GRANULAR_CONFLICT_POLICY_HIERARCHY, GranularConflictPolicy.Hierarchy]
    ])('maps granular refinement %s', (grpcPolicy, expected) => {
        expect(ConflictResolutionConverter.convertGranularConflictPolicy(grpcPolicy)).toBe(expected)
    })

    test.each([
        [GrpcConflictResolutionOverride.CONFLICT_RESOLUTION_OVERRIDE_INHERITED, ConflictResolutionOverride.Inherited],
        [GrpcConflictResolutionOverride.CONFLICT_RESOLUTION_OVERRIDE_GRANULAR, ConflictResolutionOverride.Granular],
        [GrpcConflictResolutionOverride.CONFLICT_RESOLUTION_OVERRIDE_ENTITY, ConflictResolutionOverride.Entity]
    ])('maps per-item override %s', (grpcOverride, expected) => {
        expect(ConflictResolutionConverter.convertConflictResolutionOverride(grpcOverride)).toBe(expected)
    })

    test('an absent conflict resolution message means the schema inherits', () => {
        expect(ConflictResolutionConverter.convertConflictResolution(undefined)).toBeUndefined()
    })

    test('an absent override means the item declares none', () => {
        expect(ConflictResolutionConverter.convertConflictResolutionOverride(undefined))
            .toBe(ConflictResolutionOverride.Inherited)
    })

    test('a present message carries the policy and its refinements', () => {
        const resolution = ConflictResolutionConverter.convertConflictResolution(grpcConflictResolution(
            GrpcConflictPolicy.CONFLICT_POLICY_ENTITY,
            [
                GrpcGranularConflictPolicy.GRANULAR_CONFLICT_POLICY_ENTITY_ATTRIBUTE,
                GrpcGranularConflictPolicy.GRANULAR_CONFLICT_POLICY_PRICE
            ]
        ))
        expect(resolution?.policy).toBe(ConflictPolicy.Entity)
        expect(resolution?.granularity.toArray()).toEqual([
            GranularConflictPolicy.EntityAttribute,
            GranularConflictPolicy.Price
        ])
    })
})

describe('CatalogSchemaConverter conflict resolution wiring', () => {
    test('the catalog resolution is mapped and its absence preserved', () => {
        const withResolution = converter.convert(
            {
                version: 1,
                name: 'testCatalog',
                nameVariant: [],
                description: undefined,
                attributes: {},
                conflictResolution: grpcConflictResolution(GrpcConflictPolicy.CONFLICT_POLICY_COLLECTION)
            } as unknown as GrpcCatalogSchema,
            noEntitySchemas
        )
        expect(withResolution.conflictResolution?.policy).toBe(ConflictPolicy.Collection)

        const withoutResolution = converter.convert(
            {
                version: 1,
                name: 'testCatalog',
                nameVariant: [],
                description: undefined,
                attributes: {},
                conflictResolution: undefined
            } as unknown as GrpcCatalogSchema,
            noEntitySchemas
        )
        expect(withoutResolution.conflictResolution).toBeUndefined()
    })

    test('the entity resolution is mapped and its absence preserved', () => {
        expect(converter.convertEntitySchema(grpcEntitySchema({
            conflictResolution: grpcConflictResolution(
                GrpcConflictPolicy.CONFLICT_POLICY_ENTITY,
                [GrpcGranularConflictPolicy.GRANULAR_CONFLICT_POLICY_ENTITY_ATTRIBUTE]
            )
        })).conflictResolution?.granularity.toArray()).toEqual([GranularConflictPolicy.EntityAttribute])

        expect(converter.convertEntitySchema(grpcEntitySchema({})).conflictResolution).toBeUndefined()
    })

    test('an entity attribute override reaches the model', () => {
        const attribute = converter.convertEntitySchema(grpcEntitySchema({
            attributes: {
                code: grpcAttribute(
                    'code',
                    GrpcAttributeSchemaType.ENTITY_SCHEMA,
                    GrpcConflictResolutionOverride.CONFLICT_RESOLUTION_OVERRIDE_ENTITY
                )
            }
        })).attributes.get('code')
        expect(attribute).toBeInstanceOf(EntityAttributeSchema)
        expect(attribute?.conflictResolutionOverride).toBe(ConflictResolutionOverride.Entity)
    })

    test('a global attribute override reaches the model', () => {
        const attribute = converter.convert(
            {
                version: 1,
                name: 'testCatalog',
                nameVariant: [],
                description: undefined,
                attributes: {
                    url: grpcAttribute(
                        'url',
                        GrpcAttributeSchemaType.GLOBAL_SCHEMA,
                        GrpcConflictResolutionOverride.CONFLICT_RESOLUTION_OVERRIDE_GRANULAR
                    )
                },
                conflictResolution: undefined
            } as unknown as GrpcCatalogSchema,
            noEntitySchemas
        ).attributes.get('url')
        expect(attribute).toBeInstanceOf(GlobalAttributeSchema)
        expect(attribute?.conflictResolutionOverride).toBe(ConflictResolutionOverride.Granular)
    })

    test('a reference attribute override reaches the model', () => {
        const reference = converter.convertEntitySchema(grpcEntitySchema({
            references: {
                master: grpcReferenceSchema(
                    GrpcConflictResolutionOverride.CONFLICT_RESOLUTION_OVERRIDE_INHERITED,
                    {
                        priority: grpcAttribute(
                            'priority',
                            GrpcAttributeSchemaType.REFERENCE_SCHEMA,
                            GrpcConflictResolutionOverride.CONFLICT_RESOLUTION_OVERRIDE_GRANULAR
                        )
                    }
                )
            }
        })).references.get('master')
        const attribute = reference?.attributes.get('priority')
        expect(attribute).toBeInstanceOf(ReferenceAttributeSchema)
        expect(attribute?.conflictResolutionOverride).toBe(ConflictResolutionOverride.Granular)
        expect(reference?.conflictResolutionOverride).toBe(ConflictResolutionOverride.Inherited)
    })

    test('a reflected reference passes the override through to the model', () => {
        const reference = converter.convertEntitySchema(grpcEntitySchema({
            references: {
                masterReflection: {
                    ...grpcReferenceSchema(GrpcConflictResolutionOverride.CONFLICT_RESOLUTION_OVERRIDE_INHERITED),
                    name: 'masterReflection',
                    reflectedReferenceName: 'master',
                    descriptionInherited: true,
                    deprecationNoticeInherited: true,
                    cardinalityInherited: true,
                    facetedInherited: true,
                    indexedInherited: true,
                    attributeInheritanceBehavior: GrpcAttributeInheritanceBehavior.INHERIT_ALL_EXCEPT,
                    attributeInheritanceFilter: []
                }
            }
        })).references.get('masterReflection')
        expect(reference).toBeInstanceOf(ReflectedReferenceSchema)
        expect(reference?.conflictResolutionOverride).toBe(ConflictResolutionOverride.Inherited)
    })

    test('associated data and reference overrides reach the model', () => {
        const entitySchema = converter.convertEntitySchema(grpcEntitySchema({
            associatedData: {
                localization: {
                    name: 'localization',
                    nameVariant: [],
                    description: undefined,
                    deprecationNotice: undefined,
                    type: GrpcEvitaAssociatedDataDataType_GrpcEvitaDataType.COMPLEX_DATA_OBJECT,
                    nullable: false,
                    localized: false,
                    conflictResolutionOverride: GrpcConflictResolutionOverride.CONFLICT_RESOLUTION_OVERRIDE_GRANULAR
                }
            },
            references: {
                master: grpcReferenceSchema(GrpcConflictResolutionOverride.CONFLICT_RESOLUTION_OVERRIDE_ENTITY)
            }
        }))
        expect(entitySchema.associatedData.get('localization')?.conflictResolutionOverride)
            .toBe(ConflictResolutionOverride.Granular)
        expect(entitySchema.references.get('master')?.conflictResolutionOverride)
            .toBe(ConflictResolutionOverride.Entity)
    })
})
