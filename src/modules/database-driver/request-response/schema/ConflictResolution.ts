import type { List } from 'immutable'
import type { ConflictPolicy } from '@/modules/database-driver/request-response/schema/ConflictPolicy.ts'
import {
    GranularConflictPolicy
} from '@/modules/database-driver/request-response/schema/GranularConflictPolicy.ts'

/**
 * Conflict resolution declared on a catalog or an entity schema: a coarse {@link ConflictPolicy} plus,
 * only under {@link ConflictPolicy.Entity}, a set of granular refinements.
 *
 * Absence of this value on a schema means the schema inherits the resolution from a less specific level; the
 * base of that inheritance chain is the engine-wide default, which the server reports through its engine
 * settings and which is therefore never hardcoded here.
 */
export class ConflictResolution {

    readonly policy: ConflictPolicy
    /**
     * Granular refinements of the policy. Always empty unless {@link policy} is
     * {@link ConflictPolicy.Entity}.
     */
    readonly granularity: List<GranularConflictPolicy>

    constructor(policy: ConflictPolicy, granularity: List<GranularConflictPolicy>) {
        this.policy = policy
        this.granularity = granularity
    }
}
