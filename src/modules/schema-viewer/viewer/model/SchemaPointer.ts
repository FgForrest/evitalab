import { DefineComponent, Raw } from 'vue'
import { List } from 'immutable'

/**
 * Defines which concrete schema to show.
 */
export interface SchemaPointer {
    readonly catalogName: string

    /**
     * Returns component that will be used to render this schema.
     */
    component(): Raw<DefineComponent<any, any, any>>

    /**
     * Returns path to this schema.
     */
    path(): List<string>
}
