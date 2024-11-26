import { DefineComponent, Raw } from 'vue'
import { SchemaType } from '@/modules/schema-viewer/viewer/model/SchemaType'

/**
 * Defines which concrete schema to show.
 */
export interface SchemaPointer {

    /**
     * Returns name of this schema.
     */
    get schemaName(): string

    /**
     * Returns simplified type of schema it represents
     */
    get schemaType(): SchemaType

    /**
     * To which catalog the schema belongs
     */
    get catalogName(): string

    /**
     * Returns component that will be used to render this schema.
     */
    get component(): Raw<DefineComponent<any, any, any>>
}
