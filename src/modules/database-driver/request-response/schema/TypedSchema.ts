import { Schema } from '@/modules/database-driver/request-response/schema/Schema'
import { Scalar } from '@/modules/database-driver/data-type/Scalar'

/**
 * {@link Schema} with associated data type
 */
export interface TypedSchema extends Schema {
    /**
     * Data type of the schema. Must be one of Evita-supported values. Internally the scalar is converted into Java-corresponding data type.
     */
    readonly type: Scalar
}

export function isTypedSchema(schema: Schema): schema is TypedSchema {
    return (schema as TypedSchema).type !== undefined
}
