import type {
    ConflictResolution
} from '@/modules/database-driver/request-response/schema/ConflictResolution.ts'

/**
 * Sets (or clears) the conflict resolution declared on an entity schema.
 *
 * An undefined resolution means the declaration was removed, so the schema inherits again.
 */
export class ModifyEntitySchemaConflictResolutionMutation {
    static readonly TYPE = 'modifyEntitySchemaConflictResolutionMutation' as const

    readonly conflictResolution: ConflictResolution | undefined

    constructor(conflictResolution: ConflictResolution | undefined) {
        this.conflictResolution = conflictResolution
    }
}
