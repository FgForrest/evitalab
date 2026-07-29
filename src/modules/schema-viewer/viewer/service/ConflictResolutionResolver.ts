import { CatalogSchema } from '@/modules/database-driver/request-response/schema/CatalogSchema.ts'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema.ts'
import type {
    ConflictResolution
} from '@/modules/database-driver/request-response/schema/ConflictResolution.ts'
import {
    ConflictResolutionOverride
} from '@/modules/database-driver/request-response/schema/ConflictResolutionOverride.ts'
import { ConflictPolicy } from '@/modules/database-driver/request-response/schema/ConflictPolicy.ts'
import {
    GranularConflictPolicy
} from '@/modules/database-driver/request-response/schema/GranularConflictPolicy.ts'

/**
 * Level that actually supplied the conflict resolution rendered on a schema tab. evitaDB returns each
 * level's declared value only, so which level won has to be derived on the client.
 */
export enum PolicySource {
    /**
     * The inspected schema declares the resolution itself.
     */
    DefinedHere = 'definedHere',
    /**
     * The inspected entity schema declares nothing and uses the catalog's resolution.
     */
    InheritedFromCatalog = 'inheritedFromCatalog',
    /**
     * Neither the entity nor the catalog declares anything, so the engine-wide default configured on the
     * server applies.
     */
    EngineDefault = 'engineDefault'
}

/**
 * Kind of schema item whose effective conflict scope is being resolved. Distinguishes a plain entity
 * attribute from an attribute of a reference - they resolve against different granular flags.
 */
export enum ConflictItemKind {
    EntityAttribute = 'entityAttribute',
    ReferenceAttribute = 'referenceAttribute',
    AssociatedData = 'associatedData',
    Reference = 'reference'
}

/**
 * Effective conflict scope of a single schema item.
 */
export enum ItemScopeOutcome {
    /**
     * Only concurrent writes changing this very item conflict.
     */
    ThisItemOnly = 'thisItemOnly',
    /**
     * Any concurrent write changing the owning entity conflicts.
     */
    WholeEntity = 'wholeEntity',
    /**
     * Conflict detection is off for the owning entity - the last writer wins.
     */
    NoDetection = 'noDetection',
    /**
     * Any concurrent write changing anything in the catalog conflicts.
     */
    WholeCatalog = 'wholeCatalog',
    /**
     * Any concurrent write changing any entity of the same type conflicts.
     */
    WholeCollection = 'wholeCollection'
}

/**
 * Conflict resolution effective for a catalog or an entity together with the level it came from.
 */
export interface ResolvedPolicy {
    readonly resolution: ConflictResolution
    readonly source: PolicySource
}

/**
 * Conflict scope effective for a single schema item.
 */
export interface ResolvedItemScope {
    readonly outcome: ItemScopeOutcome
    /**
     * TRUE when the item declares an override that has no effect because the entity's effective coarse
     * scope is wider than {@link ConflictPolicy.Entity}.
     */
    readonly inert: boolean
}

/**
 * Resolves the conflict resolution effective for a catalog: its own declaration, or the engine-wide default
 * when it declares none.
 *
 * @param engineDefault the default the server reports through its engine settings - it is configurable and
 *        must never be assumed
 */
export function resolveCatalogPolicy(
    catalogSchema: CatalogSchema,
    engineDefault: ConflictResolution
): ResolvedPolicy {
    if (catalogSchema.conflictResolution != undefined) {
        return { resolution: catalogSchema.conflictResolution, source: PolicySource.DefinedHere }
    }
    return { resolution: engineDefault, source: PolicySource.EngineDefault }
}

/**
 * Resolves the conflict resolution effective for an entity type. The most specific level that declares
 * a resolution wins outright - both the coarse scope and the granular refinement set, with no merging.
 *
 * The catalog schema may be undefined while it is still being loaded; the entity's own declaration then
 * still resolves correctly and only inheritance falls back to the engine default.
 *
 * @param engineDefault the default the server reports through its engine settings - it is configurable and
 *        must never be assumed
 */
export function resolveEntityPolicy(
    entitySchema: EntitySchema,
    catalogSchema: CatalogSchema | undefined,
    engineDefault: ConflictResolution
): ResolvedPolicy {
    if (entitySchema.conflictResolution != undefined) {
        return { resolution: entitySchema.conflictResolution, source: PolicySource.DefinedHere }
    }
    if (catalogSchema?.conflictResolution != undefined) {
        return {
            resolution: catalogSchema.conflictResolution,
            source: PolicySource.InheritedFromCatalog
        }
    }
    return { resolution: engineDefault, source: PolicySource.EngineDefault }
}

/**
 * Resolves the conflict scope actually applied to writes of a single schema item.
 *
 * Per-item overrides take effect only under a coarse {@link ConflictPolicy.Entity} policy; under any
 * wider (or disabled) policy the coarse scope dominates and a declared override is reported as inert.
 */
export function resolveItemScope(
    itemKind: ConflictItemKind,
    override: ConflictResolutionOverride,
    entityPolicy: ResolvedPolicy
): ResolvedItemScope {
    const overridden: boolean = override !== ConflictResolutionOverride.Inherited

    switch (entityPolicy.resolution.policy) {
        case ConflictPolicy.None:
            return { outcome: ItemScopeOutcome.NoDetection, inert: overridden }
        case ConflictPolicy.Catalog:
            return { outcome: ItemScopeOutcome.WholeCatalog, inert: overridden }
        case ConflictPolicy.Collection:
            return { outcome: ItemScopeOutcome.WholeCollection, inert: overridden }
    }

    if (override === ConflictResolutionOverride.Entity) {
        return { outcome: ItemScopeOutcome.WholeEntity, inert: false }
    }
    if (override === ConflictResolutionOverride.Granular) {
        return { outcome: ItemScopeOutcome.ThisItemOnly, inert: false }
    }

    const granular: boolean = entityPolicy.resolution.granularity
        .includes(granularFlagFor(itemKind))
    return {
        outcome: granular ? ItemScopeOutcome.ThisItemOnly : ItemScopeOutcome.WholeEntity,
        inert: false
    }
}

/**
 * Granular refinement flag governing the given item kind when the item declares no override.
 */
export function granularFlagFor(itemKind: ConflictItemKind): GranularConflictPolicy {
    switch (itemKind) {
        case ConflictItemKind.EntityAttribute:
            return GranularConflictPolicy.EntityAttribute
        case ConflictItemKind.ReferenceAttribute:
            return GranularConflictPolicy.ReferenceAttribute
        case ConflictItemKind.AssociatedData:
            return GranularConflictPolicy.AssociatedData
        case ConflictItemKind.Reference:
            return GranularConflictPolicy.Reference
    }
}
