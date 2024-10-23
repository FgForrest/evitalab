// todo docs
import { Value } from '@/modules/connection/model/Value'
import { Schema } from '@/modules/connection/model/schema/Schema'

export interface LocalizedSchema extends Schema {
    /**
     * When the schema is localized, it has to be ALWAYS used in connection with specific `Locale`.
     */
    readonly localized: Value<boolean>
}

export function isLocalizedSchema(schema: Schema): schema is LocalizedSchema {
    return (schema as LocalizedSchema).localized !== undefined
}
