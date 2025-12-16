import type { LocalMutation } from '../data/mutation/LocalMutation'
import type { SchemaMutation } from '../schema/mutation/SchemaMutation'
import { UpsertAttributeMutation } from '../data/mutation/attribute/UpsertAttributeMutation'
import { UpsertAssociatedDataMutation } from '../data/mutation/associatedData/UpsertAssociatedDataMutation'
import { UpsertPriceMutation } from '../data/mutation/price/UpsertPriceMutation'
import { InsertReferenceMutation } from '../data/mutation/reference/InsertReferenceMutation'
import { RemoveAttributeMutation } from '../data/mutation/attribute/RemoveAttributeMutation'
import { RemoveAssociatedDataMutation } from '../data/mutation/associatedData/RemoveAssociatedDataMutation'
import { RemovePriceMutation } from '../data/mutation/price/RemovePriceMutation'
import { RemoveReferenceMutation } from '../data/mutation/reference/RemoveReferenceMutation'

/**
 * Gets the stable type name for a mutation that survives minification.
 *
 * This function uses the static TYPE constant if available on the mutation class.
 * The TYPE constant uses camelCase format matching protobuf field names, ensuring
 * consistency with converter keys and stability after build minification.
 *
 * @param mutation - The mutation instance (LocalMutation, SchemaMutation, or any object)
 * @returns The stable type name (e.g., 'upsertAttributeMutation')
 *
 * @example
 * const mutation = new UpsertAttributeMutation(...)
 * getMutationType(mutation) // Returns: 'upsertAttributeMutation'
 */
export function getMutationType(mutation: LocalMutation | SchemaMutation | any): string {
    // Check if class has static TYPE constant
    if (mutation?.constructor && 'TYPE' in mutation.constructor) {
        return mutation.constructor.TYPE
    }

    // Fallback for classes without TYPE constant (development only - will break in production)
    if (import.meta.env.DEV) {
        console.warn(
            `Mutation class ${mutation?.constructor?.name || 'unknown'} is missing static TYPE constant. ` +
            'Add a static readonly TYPE field to ensure minification compatibility.'
        )
    }

    return mutation?.constructor?.name || 'UnknownMutation'
}

/**
 * Determines if a mutation is an "upsert" type operation.
 *
 * This function uses instanceof checks which are minification-safe,
 * unlike string matching on constructor.name which breaks after build.
 *
 * @param mutation - The local mutation to check
 * @returns True if the mutation is an upsert-type operation
 *
 * @example
 * if (isUpsertMutation(mutation)) {
 *   console.log('This is an upsert operation')
 * }
 */
export function isUpsertMutation(mutation: LocalMutation): boolean {
    // Type-safe instanceof checks (works after minification)
    return (
        mutation instanceof UpsertAttributeMutation ||
        mutation instanceof UpsertAssociatedDataMutation ||
        mutation instanceof UpsertPriceMutation ||
        mutation instanceof InsertReferenceMutation
        // Add other upsert-type mutations as needed
    )
}

/**
 * Determines if a mutation is a "remove" type operation.
 *
 * This function uses instanceof checks which are minification-safe,
 * unlike string matching on constructor.name which breaks after build.
 *
 * @param mutation - The local mutation to check
 * @returns True if the mutation is a remove-type operation
 *
 * @example
 * if (isRemoveMutation(mutation)) {
 *   console.log('This is a remove operation')
 * }
 */
export function isRemoveMutation(mutation: LocalMutation): boolean {
    return (
        mutation instanceof RemoveAttributeMutation ||
        mutation instanceof RemoveAssociatedDataMutation ||
        mutation instanceof RemovePriceMutation ||
        mutation instanceof RemoveReferenceMutation
        // Add other remove-type mutations as needed
    )
}

/**
 * Gets a human-readable operation type for UI display.
 *
 * This function categorizes mutations into three types: 'upsert', 'remove', or 'modify'.
 * Uses minification-safe instanceof checks instead of constructor.name string matching.
 *
 * @param mutation - The local mutation to categorize
 * @returns The operation type: 'upsert' for insert/update operations,
 *          'remove' for delete operations, 'modify' for other modifications
 *
 * @example
 * const type = getMutationOperationType(mutation)
 * const title = i18n.t(`mutation.${type}`, { key: mutation.key })
 */
export function getMutationOperationType(mutation: LocalMutation): 'upsert' | 'remove' | 'modify' {
    if (isUpsertMutation(mutation)) return 'upsert'
    if (isRemoveMutation(mutation)) return 'remove'
    return 'modify'
}
