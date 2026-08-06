import type { List } from 'immutable'
import type { Schema } from '@/modules/database-driver/request-response/schema/Schema'
import type { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'

/**
 * Schema for data that can be sorted
 */
export interface SortableSchema extends Schema{
    /**
     * Scopes in which entities can be sorted by this schema. An empty list means the schema is not sortable at all.
     * Do not mark attribute as sortable unless you know that you'll sort entities along this attribute. Each sortable
     * attribute occupies (memory/disk) space in the form of index.
     */
    readonly sortableInScopes: List<EntityScope>
}

export function isSortableSchema(schema: Schema): schema is SortableSchema {
    return (schema as SortableSchema).sortableInScopes !== undefined
}
