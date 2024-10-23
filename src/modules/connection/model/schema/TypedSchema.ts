import { Schema } from '@/modules/connection/model/schema/Schema'
import { Value } from '@/modules/connection/model/Value'
import { Scalar } from '@/modules/connection/model/data-type/Scalar'

// todo docs
export interface TypedSchema extends Schema {
    /**
     * Data type of the schema. Must be one of Evita-supported values. Internally the scalar is converted into Java-corresponding data type.
     */
    readonly type: Value<Scalar>
}

export function isTypedSchema(schema: Schema): schema is TypedSchema {
    return (schema as TypedSchema).type !== undefined
}
