import type {
    ConflictResolution
} from '@/modules/database-driver/request-response/schema/ConflictResolution.ts'

/**
 * Sets (or clears) the conflict resolution declared on a catalog schema.
 *
 * An undefined resolution means the declaration was removed, so the schema inherits again.
 */
export class ModifyCatalogSchemaConflictResolutionMutation {
    static readonly TYPE = 'modifyCatalogSchemaConflictResolutionMutation' as const

    readonly conflictResolution: ConflictResolution | undefined

    constructor(conflictResolution: ConflictResolution | undefined) {
        this.conflictResolution = conflictResolution
    }
}
