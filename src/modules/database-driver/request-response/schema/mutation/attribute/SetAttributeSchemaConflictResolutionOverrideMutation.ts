import type {
    ConflictResolutionOverride
} from '@/modules/database-driver/request-response/schema/ConflictResolutionOverride.ts'

/**
 * Sets the per-item conflict resolution override of an attribute schema.
 */
export class SetAttributeSchemaConflictResolutionOverrideMutation {
    static readonly TYPE = 'setAttributeSchemaConflictResolutionOverrideMutation' as const

    readonly name: string
    readonly conflictResolutionOverride: ConflictResolutionOverride

    constructor(name: string, conflictResolutionOverride: ConflictResolutionOverride) {
        this.name = name
        this.conflictResolutionOverride = conflictResolutionOverride
    }
}
