import { Schema } from '@/modules/database-driver/request-response/schema/Schema'

/**
 * Schema for data that can be sorted
 */
export interface SortableSchema extends Schema{
    /**
     * When the schema is sortable, it is possible to sort entities by this attribute. Do not mark attribute as sortable unless you know that you'll sort entities along this attribute. Each sortable attribute occupies (memory/disk) space in the form of index..
     */
    readonly sortable: boolean
}

export function isSortableSchema(schema: Schema): schema is SortableSchema {
    return (schema as SortableSchema).sortable !== undefined
}
