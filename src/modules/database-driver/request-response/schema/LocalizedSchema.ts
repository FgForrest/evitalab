import type { Schema } from '@/modules/database-driver/request-response/schema/Schema'

/**
 * {@link Schema} with associated locale
 */
export interface LocalizedSchema extends Schema {
    /**
     * When the schema is localized, it has to be ALWAYS used in connection with specific `Locale`.
     */
    readonly localized: boolean
}

export function isLocalizedSchema(schema: Schema): schema is LocalizedSchema {
    return (schema as LocalizedSchema).localized !== undefined
}
