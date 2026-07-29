import { List as ImmutableList } from 'immutable'
import { Property } from '@/modules/base/model/properties-table/Property.ts'
import { PropertyValue } from '@/modules/base/model/properties-table/PropertyValue.ts'
import { KeywordValue } from '@/modules/base/model/properties-table/KeywordValue.ts'
import { i18n } from '@/vue-plugins/i18n.ts'
import { ConflictPolicy } from '@/modules/database-driver/request-response/schema/ConflictPolicy.ts'
import {
    GranularConflictPolicy
} from '@/modules/database-driver/request-response/schema/GranularConflictPolicy.ts'
import {
    ConflictResolutionOverride
} from '@/modules/database-driver/request-response/schema/ConflictResolutionOverride.ts'
import {
    ConflictItemKind,
    ItemScopeOutcome,
    PolicySource,
    type ResolvedItemScope,
    type ResolvedPolicy
} from '@/modules/schema-viewer/viewer/service/ConflictResolutionResolver.ts'

/**
 * Schema level a conflict resolution is rendered on. Governs the wording of level-aware hints and of
 * the "follows ... policy" badge on item rows.
 */
export enum ConflictPolicyLevel {
    Catalog = 'catalog',
    Entity = 'entity'
}

const conflictResolutionKey: string = 'schemaViewer.conflictResolution'

/**
 * Chip colours encode how wide the conflict net is: the wider the net, the more concurrent writes are
 * rejected. `None` is deliberately not red - it is a data-safety warning, not a throughput one, and
 * carries a warning note instead.
 */
const scopeColors: Record<ConflictPolicy, string | undefined> = {
    [ConflictPolicy.None]: undefined,
    [ConflictPolicy.Catalog]: 'error',
    [ConflictPolicy.Collection]: 'warning',
    [ConflictPolicy.Entity]: 'success'
}

/**
 * Builds the single "Conflict resolution" row rendered on the catalog and entity tabs: the coarse-scope
 * chip, its granular refinements and a badge telling which level the resolution came from.
 */
export function buildConflictResolutionProperty(
    resolved: ResolvedPolicy,
    level: ConflictPolicyLevel
): Property {
    const t = i18n.global.t
    const policy: ConflictPolicy = resolved.resolution.policy

    const values: PropertyValue[] = [
        new PropertyValue(
            new KeywordValue(
                t(`${conflictResolutionKey}.scope.${policy}.label`),
                scopeColors[policy],
                composeHint(
                    t(`${conflictResolutionKey}.scope.${policy}.short`),
                    t(`${conflictResolutionKey}.scope.${policy}.hint`)
                )
            ),
            // last-writer-wins is the only scope that can silently lose a concurrent change
            policy === ConflictPolicy.None
                ? t(`${conflictResolutionKey}.scope.none.hint`)
                : undefined
        )
    ]

    if (policy === ConflictPolicy.Entity) {
        for (const granular of resolved.resolution.granularity) {
            values.push(new PropertyValue(new KeywordValue(
                t(`${conflictResolutionKey}.granular.${granular}.label`),
                'info',
                granularHint(granular, level)
            )))
        }
    }

    values.push(provenanceBadge(
        resolved.source,
        t(`common.item.${level}`),
        // the engine default is server-configured, so its hint names the scope the server actually reports
        t(`${conflictResolutionKey}.scope.${policy}.label`)
    ))

    return new Property(
        t(`${conflictResolutionKey}.label.conflictResolution`),
        ImmutableList(values),
        rowHelp(level)
    )
}

/**
 * Builds the "Conflict resolution override" row of an item tab. Returns undefined when the item declares
 * no override - the row is rendered only for an explicitly declared one.
 */
export function buildConflictOverrideProperty(
    override: ConflictResolutionOverride,
    itemScope: ResolvedItemScope,
    ownerPolicy: ResolvedPolicy,
    itemKind: ConflictItemKind,
    ownerLevel: ConflictPolicyLevel
): Property | undefined {
    if (override === ConflictResolutionOverride.Inherited) {
        return undefined
    }

    const t = i18n.global.t
    const item: string = itemNoun(itemKind)

    const values: PropertyValue[] = [
        new PropertyValue(
            new KeywordValue(
                t(`${conflictResolutionKey}.override.${override}.label`),
                override === ConflictResolutionOverride.Entity ? 'success' : 'info',
                composeHint(
                    t(`${conflictResolutionKey}.override.${override}.short`, { item }),
                    t(`${conflictResolutionKey}.override.${override}.hint`, { item })
                )
            ),
            itemScope.inert
                ? t(`${conflictResolutionKey}.inertWarning.${ownerLevel}`, {
                    scope: t(`${conflictResolutionKey}.scope.${ownerPolicy.resolution.policy}.label`)
                })
                : undefined
        ),
        provenanceBadge(PolicySource.DefinedHere, item)
    ]

    return new Property(
        t(`${conflictResolutionKey}.label.conflictResolutionOverride`),
        ImmutableList(values)
    )
}

/**
 * Builds the always-rendered "Effective conflict scope" row of an item tab: the scope actually applied to
 * writes of the item after the entity policy and the item's own override have been resolved.
 */
export function buildEffectiveConflictScopeProperty(
    itemScope: ResolvedItemScope,
    override: ConflictResolutionOverride,
    itemKind: ConflictItemKind,
    ownerLevel: ConflictPolicyLevel
): Property {
    const t = i18n.global.t
    const item: string = itemNoun(itemKind)

    const values: PropertyValue[] = [
        new PropertyValue(new KeywordValue(
            t(`${conflictResolutionKey}.outcome.${itemScope.outcome}.label`, { item }),
            outcomeColor(itemScope.outcome),
            t(`${conflictResolutionKey}.outcome.${itemScope.outcome}.hint`, { item }),
        ))
    ]

    if (override === ConflictResolutionOverride.Inherited) {
        const followsKey: string = ownerLevel === ConflictPolicyLevel.Catalog
            ? 'followsCatalogPolicy'
            : 'followsEntityPolicy'
        values.push(new PropertyValue(new KeywordValue(
            t(`${conflictResolutionKey}.provenance.${followsKey}.label`),
            undefined,
            t(`${conflictResolutionKey}.provenance.${followsKey}.hint`, { item })
        )))
    }

    return new Property(
        t(`${conflictResolutionKey}.label.effectiveConflictScope`),
        ImmutableList(values),
        t(`${conflictResolutionKey}.help.effectiveScope.${ownerLevel}`, { item })
    )
}

/**
 * Item noun used in the copy. Both attribute kinds share the plain "attribute" noun - the kind only
 * decides which granular refinement the item resolves against.
 */
export function itemNoun(itemKind: ConflictItemKind): string {
    switch (itemKind) {
        case ConflictItemKind.EntityAttribute:
        case ConflictItemKind.ReferenceAttribute:
            return i18n.global.t('common.item.attribute')
        case ConflictItemKind.AssociatedData:
            return i18n.global.t('common.item.associatedData')
        case ConflictItemKind.Reference:
            return i18n.global.t('common.item.reference')
    }
}

function provenanceBadge(source: PolicySource, level: string, scope?: string): PropertyValue {
    const t = i18n.global.t
    return new PropertyValue(new KeywordValue(
        t(`${conflictResolutionKey}.provenance.${source}.label`),
        undefined,
        t(`${conflictResolutionKey}.provenance.${source}.hint`, { level, item: level, scope: scope ?? '' })
    ))
}

function outcomeColor(outcome: ItemScopeOutcome): string | undefined {
    switch (outcome) {
        case ItemScopeOutcome.ThisItemOnly:
            return 'info'
        case ItemScopeOutcome.WholeEntity:
            return 'success'
        case ItemScopeOutcome.WholeCollection:
            return 'warning'
        case ItemScopeOutcome.WholeCatalog:
            return 'error'
        case ItemScopeOutcome.NoDetection:
            return undefined
    }
}

function granularHint(granular: GranularConflictPolicy, level: ConflictPolicyLevel): string {
    const t = i18n.global.t
    const hint: string = t(`${conflictResolutionKey}.granular.${granular}.hint`)
    // only the per-attribute refinement cascades differently depending on the level it is declared on
    const levelNote: string = granular === GranularConflictPolicy.EntityAttribute
        ? ` ${t(`${conflictResolutionKey}.granular.entityAttribute.levelNote.${level}`)}`
        : ''
    return composeHint(t(`${conflictResolutionKey}.granular.${granular}.short`), `${hint}${levelNote}`)
}

function rowHelp(level: ConflictPolicyLevel): string {
    const t = i18n.global.t
    return [
        t(`${conflictResolutionKey}.help.${level}`),
        t(`${conflictResolutionKey}.help.granularIntro`),
        t(`${conflictResolutionKey}.help.colorLegend`)
    ].join(' ')
}

function composeHint(short: string, hint: string): string {
    return `${short} — ${hint}`
}
