import { describe, expect, test } from 'vitest'
import { List, Map } from 'immutable'
import {
    ConflictItemKind,
    ItemScopeOutcome,
    PolicySource,
    granularFlagFor,
    resolveCatalogPolicy,
    resolveEntityPolicy,
    resolveItemScope
} from '../../../src/modules/schema-viewer/viewer/service/ConflictResolutionResolver'
import { ConflictResolution } from '../../../src/modules/database-driver/request-response/schema/ConflictResolution'
import { ConflictPolicy } from '../../../src/modules/database-driver/request-response/schema/ConflictPolicy'
import { ConflictResolutionOverride } from '../../../src/modules/database-driver/request-response/schema/ConflictResolutionOverride'
import { GranularConflictPolicy } from '../../../src/modules/database-driver/request-response/schema/GranularConflictPolicy'
import { CatalogSchema } from '../../../src/modules/database-driver/request-response/schema/CatalogSchema'
import { EntitySchema } from '../../../src/modules/database-driver/request-response/schema/EntitySchema'
import { NamingConvention } from '../../../src/modules/database-driver/request-response/NamingConvetion'
import type { EntitySchemaAccessor } from '../../../src/modules/database-driver/request-response/schema/EntitySchemaAccessor'

const nameVariants = Map<NamingConvention, string>()
const noEntitySchemas: EntitySchemaAccessor = {
    getEntitySchemas: async () => List(),
    getEntitySchema: async () => undefined
}

function resolution(policy: ConflictPolicy, ...granularity: GranularConflictPolicy[]): ConflictResolution {
    return new ConflictResolution(policy, List(granularity))
}

function catalogSchema(conflictResolution?: ConflictResolution): CatalogSchema {
    return new CatalogSchema(1, 'testCatalog', nameVariants, undefined, [], noEntitySchemas, conflictResolution)
}

function entitySchema(conflictResolution?: ConflictResolution): EntitySchema {
    return new EntitySchema(
        1, 'Product', nameVariants, undefined, undefined, true, false, false, 0,
        [], [], [], [], [], [], [], conflictResolution
    )
}

function entityPolicy(policy: ConflictPolicy, ...granularity: GranularConflictPolicy[]) {
    return { resolution: resolution(policy, ...granularity), source: PolicySource.DefinedHere }
}

describe('resolveCatalogPolicy', () => {
    test('reports the catalog\'s own declaration as defined here', () => {
        const resolved = resolveCatalogPolicy(catalogSchema(resolution(ConflictPolicy.Collection)))
        expect(resolved.source).toBe(PolicySource.DefinedHere)
        expect(resolved.resolution.policy).toBe(ConflictPolicy.Collection)
    })

    test('falls back to the engine default when the catalog is silent', () => {
        const resolved = resolveCatalogPolicy(catalogSchema(undefined))
        expect(resolved.source).toBe(PolicySource.EngineDefault)
        expect(resolved.resolution.policy).toBe(ConflictPolicy.Entity)
        expect(resolved.resolution.granularity.isEmpty()).toBe(true)
    })
})

describe('resolveEntityPolicy', () => {
    test('the entity declaration wins outright over the catalog one, refinements included', () => {
        const resolved = resolveEntityPolicy(
            entitySchema(resolution(ConflictPolicy.Entity, GranularConflictPolicy.Price)),
            catalogSchema(resolution(ConflictPolicy.Entity, GranularConflictPolicy.EntityAttribute))
        )
        expect(resolved.source).toBe(PolicySource.DefinedHere)
        expect(resolved.resolution.granularity.toArray()).toEqual([GranularConflictPolicy.Price])
    })

    test('a silent entity inherits the whole catalog resolution', () => {
        const resolved = resolveEntityPolicy(
            entitySchema(undefined),
            catalogSchema(resolution(ConflictPolicy.Entity, GranularConflictPolicy.EntityAttribute))
        )
        expect(resolved.source).toBe(PolicySource.InheritedFromCatalog)
        expect(resolved.resolution.granularity.toArray()).toEqual([GranularConflictPolicy.EntityAttribute])
    })

    test('both levels silent resolves to the engine default', () => {
        const resolved = resolveEntityPolicy(entitySchema(undefined), catalogSchema(undefined))
        expect(resolved.source).toBe(PolicySource.EngineDefault)
        expect(resolved.resolution.policy).toBe(ConflictPolicy.Entity)
    })

    test('a not yet loaded catalog schema still resolves the entity declaration', () => {
        expect(resolveEntityPolicy(entitySchema(resolution(ConflictPolicy.None)), undefined).source)
            .toBe(PolicySource.DefinedHere)
        expect(resolveEntityPolicy(entitySchema(undefined), undefined).source)
            .toBe(PolicySource.EngineDefault)
    })
})

describe('resolveItemScope - coarse scopes wider than per entity', () => {
    const coarse: [ConflictPolicy, ItemScopeOutcome][] = [
        [ConflictPolicy.None, ItemScopeOutcome.NoDetection],
        [ConflictPolicy.Catalog, ItemScopeOutcome.WholeCatalog],
        [ConflictPolicy.Collection, ItemScopeOutcome.WholeCollection]
    ]

    for (const [policy, outcome] of coarse) {
        for (const override of [
            ConflictResolutionOverride.Inherited,
            ConflictResolutionOverride.Granular,
            ConflictResolutionOverride.Entity
        ]) {
            test(`${policy} + ${override} dominates the override`, () => {
                const resolved = resolveItemScope(
                    ConflictItemKind.EntityAttribute,
                    override,
                    entityPolicy(policy)
                )
                expect(resolved.outcome).toBe(outcome)
                expect(resolved.inert).toBe(override !== ConflictResolutionOverride.Inherited)
            })
        }
    }
})

describe('resolveItemScope - per entity scope', () => {
    test('an entity override pins the item to whole-entity checking', () => {
        const resolved = resolveItemScope(
            ConflictItemKind.AssociatedData,
            ConflictResolutionOverride.Entity,
            entityPolicy(ConflictPolicy.Entity, GranularConflictPolicy.AssociatedData)
        )
        expect(resolved).toEqual({ outcome: ItemScopeOutcome.WholeEntity, inert: false })
    })

    test('a granular override narrows the item even without a matching refinement', () => {
        const resolved = resolveItemScope(
            ConflictItemKind.Reference,
            ConflictResolutionOverride.Granular,
            entityPolicy(ConflictPolicy.Entity)
        )
        expect(resolved).toEqual({ outcome: ItemScopeOutcome.ThisItemOnly, inert: false })
    })

    test('without an override the entity granularity set decides', () => {
        expect(resolveItemScope(
            ConflictItemKind.AssociatedData,
            ConflictResolutionOverride.Inherited,
            entityPolicy(ConflictPolicy.Entity, GranularConflictPolicy.AssociatedData)
        ).outcome).toBe(ItemScopeOutcome.ThisItemOnly)

        expect(resolveItemScope(
            ConflictItemKind.AssociatedData,
            ConflictResolutionOverride.Inherited,
            entityPolicy(ConflictPolicy.Entity, GranularConflictPolicy.EntityAttribute)
        ).outcome).toBe(ItemScopeOutcome.WholeEntity)
    })

    test('an entity attribute resolves against ENTITY_ATTRIBUTE, a reference attribute against REFERENCE_ATTRIBUTE', () => {
        const entityAttributesOnly = entityPolicy(ConflictPolicy.Entity, GranularConflictPolicy.EntityAttribute)
        expect(resolveItemScope(ConflictItemKind.EntityAttribute, ConflictResolutionOverride.Inherited, entityAttributesOnly).outcome)
            .toBe(ItemScopeOutcome.ThisItemOnly)
        expect(resolveItemScope(ConflictItemKind.ReferenceAttribute, ConflictResolutionOverride.Inherited, entityAttributesOnly).outcome)
            .toBe(ItemScopeOutcome.WholeEntity)

        const referenceAttributesOnly = entityPolicy(ConflictPolicy.Entity, GranularConflictPolicy.ReferenceAttribute)
        expect(resolveItemScope(ConflictItemKind.ReferenceAttribute, ConflictResolutionOverride.Inherited, referenceAttributesOnly).outcome)
            .toBe(ItemScopeOutcome.ThisItemOnly)
        expect(resolveItemScope(ConflictItemKind.EntityAttribute, ConflictResolutionOverride.Inherited, referenceAttributesOnly).outcome)
            .toBe(ItemScopeOutcome.WholeEntity)
    })

    test('a reference refinement does not narrow the reference\'s attributes', () => {
        const referencesOnly = entityPolicy(ConflictPolicy.Entity, GranularConflictPolicy.Reference)
        expect(resolveItemScope(ConflictItemKind.Reference, ConflictResolutionOverride.Inherited, referencesOnly).outcome)
            .toBe(ItemScopeOutcome.ThisItemOnly)
        expect(resolveItemScope(ConflictItemKind.ReferenceAttribute, ConflictResolutionOverride.Inherited, referencesOnly).outcome)
            .toBe(ItemScopeOutcome.WholeEntity)
    })
})

describe('granularFlagFor', () => {
    test('maps every item kind to its granular flag', () => {
        expect(granularFlagFor(ConflictItemKind.EntityAttribute)).toBe(GranularConflictPolicy.EntityAttribute)
        expect(granularFlagFor(ConflictItemKind.ReferenceAttribute)).toBe(GranularConflictPolicy.ReferenceAttribute)
        expect(granularFlagFor(ConflictItemKind.AssociatedData)).toBe(GranularConflictPolicy.AssociatedData)
        expect(granularFlagFor(ConflictItemKind.Reference)).toBe(GranularConflictPolicy.Reference)
    })
})
