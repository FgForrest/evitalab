import type { Schema } from '@/modules/database-driver/request-response/schema/Schema'

/**
 * {@link Schema} that carries a unique name within its owner.
 */
export interface NamedSchema extends Schema {
    /**
     * Unique name of the schema within its owner (catalog, entity, reference, ...).
     */
    readonly name: string
}

export function isNamedSchema(schema: Schema): schema is NamedSchema {
    return typeof (schema as NamedSchema).name === 'string'
}
