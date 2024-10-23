// todo docs
import { Value } from '@/modules/connection/model/Value'
import { Schema } from '@/modules/connection/model/schema/Schema'

export interface SortableSchema extends Schema{
    /**
     * When the schema is sortable, it is possible to sort entities by this attribute. Do not mark attribute as sortable unless you know that you'll sort entities along this attribute. Each sortable attribute occupies (memory/disk) space in the form of index..
     */
    readonly sortable: Value<boolean>
}

export function isSortableSchema(schema: Schema): schema is SortableSchema {
    return (schema as SortableSchema).sortable !== undefined
}
