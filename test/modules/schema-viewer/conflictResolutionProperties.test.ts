import { describe, expect, test } from 'vitest'
import { List } from 'immutable'
import {
    buildConflictOverrideProperty,
    buildConflictResolutionProperty,
    buildEffectiveConflictScopeProperty,
    ConflictPolicyLevel
} from '../../../src/modules/schema-viewer/viewer/component/conflict-resolution/conflictResolutionProperties'
import {
    ConflictItemKind,
    ItemScopeOutcome,
    PolicySource,
    type ResolvedPolicy
} from '../../../src/modules/schema-viewer/viewer/service/ConflictResolutionResolver'
import { ConflictResolution } from '../../../src/modules/database-driver/request-response/schema/ConflictResolution'
import { ConflictPolicy } from '../../../src/modules/database-driver/request-response/schema/ConflictPolicy'
import { GranularConflictPolicy } from '../../../src/modules/database-driver/request-response/schema/GranularConflictPolicy'
import { ConflictResolutionOverride } from '../../../src/modules/database-driver/request-response/schema/ConflictResolutionOverride'
import { Property } from '../../../src/modules/base/model/properties-table/Property'
import { PropertyValue } from '../../../src/modules/base/model/properties-table/PropertyValue'
import { KeywordValue } from '../../../src/modules/base/model/properties-table/KeywordValue'
import { i18n } from '../../../src/vue-plugins/i18n'

/**
 * The rows are assembled from interpolated i18n keys, so a key that doesn't exist renders as the raw
 * path instead of failing. These tests walk every enum value through the builders and assert that no
 * rendered label, tooltip, note or row help leaked a key.
 */
function texts(property: Property): string[] {
    const values: PropertyValue[] = List.isList(property.value)
        ? property.value.toArray()
        : [property.value as PropertyValue]
    return [
        property.name,
        property.description ?? '',
        ...values.flatMap(value => [
            value.note ?? '',
            value.value instanceof KeywordValue ? value.value.value : '',
            value.value instanceof KeywordValue ? value.value.tooltip ?? '' : ''
        ])
    ]
}

function expectNoUntranslatedKeys(property: Property | undefined): void {
    expect(property).toBeDefined()
    for (const text of texts(property!)) {
        expect(text).not.toContain('schemaViewer.')
        expect(text).not.toContain('common.item')
    }
}

const allGranularity: GranularConflictPolicy[] = Object.values(GranularConflictPolicy)

function policy(conflictPolicy: ConflictPolicy, source: PolicySource): ResolvedPolicy {
    return {
        resolution: new ConflictResolution(
            conflictPolicy,
            conflictPolicy === ConflictPolicy.Entity ? List(allGranularity) : List()
        ),
        source
    }
}

describe('conflict resolution property builders', () => {
    test('a missing key surfaces as its own path, which is what the assertions below detect', () => {
        expect(i18n.global.t('schemaViewer.conflictResolution.thisKeyDoesNotExist'))
            .toContain('schemaViewer.')
    })

    test.each(
        Object.values(ConflictPolicy).flatMap(conflictPolicy =>
            Object.values(PolicySource).flatMap(source =>
                Object.values(ConflictPolicyLevel).map(level =>
                    [conflictPolicy, source, level] as const
                )
            )
        )
    )('the %s / %s row on the %s level renders every chip', (conflictPolicy, source, level) => {
        expectNoUntranslatedKeys(buildConflictResolutionProperty(policy(conflictPolicy, source), level))
    })

    test.each(
        Object.values(ConflictItemKind).flatMap(itemKind =>
            [ConflictResolutionOverride.Granular, ConflictResolutionOverride.Entity].flatMap(override =>
                Object.values(ConflictPolicyLevel).flatMap(level =>
                    [true, false].map(inert => [itemKind, override, level, inert] as const)
                )
            )
        )
    )('the override row of a %s declaring %s on the %s level (inert: %s) renders', (itemKind, override, level, inert) => {
        expectNoUntranslatedKeys(buildConflictOverrideProperty(
            override,
            { outcome: ItemScopeOutcome.WholeEntity, inert },
            policy(inert ? ConflictPolicy.Collection : ConflictPolicy.Entity, PolicySource.DefinedHere),
            itemKind,
            level
        ))
    })

    test('no override means no override row', () => {
        expect(buildConflictOverrideProperty(
            ConflictResolutionOverride.Inherited,
            { outcome: ItemScopeOutcome.WholeEntity, inert: false },
            policy(ConflictPolicy.Entity, PolicySource.DefinedHere),
            ConflictItemKind.Reference,
            ConflictPolicyLevel.Entity
        )).toBeUndefined()
    })

    test.each(
        Object.values(ItemScopeOutcome).flatMap(outcome =>
            Object.values(ConflictItemKind).flatMap(itemKind =>
                Object.values(ConflictResolutionOverride).flatMap(override =>
                    Object.values(ConflictPolicyLevel).map(level =>
                        [outcome, itemKind, override, level] as const
                    )
                )
            )
        )
    )('the effective scope row for %s of a %s with %s on the %s level renders', (outcome, itemKind, override, level) => {
        expectNoUntranslatedKeys(buildEffectiveConflictScopeProperty(
            { outcome, inert: false },
            override,
            itemKind,
            level
        ))
    })
})
