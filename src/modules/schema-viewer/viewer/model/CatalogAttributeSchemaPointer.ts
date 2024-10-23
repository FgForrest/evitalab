import { DefineComponent, markRaw, Raw } from 'vue'
import { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'
import AttributeSchemaViewer from '@/modules/schema-viewer/viewer/component/attribute/AttributeSchemaViewer.vue'
import { List } from 'immutable'

/**
 * Points to evitaDB attribute schema nested inside a catalog schema.
 */
export class CatalogAttributeSchemaPointer implements SchemaPointer {
    readonly catalogName: string
    readonly attributeName: string

    constructor(catalogName: string, attributeName: string) {
        this.catalogName = catalogName
        this.attributeName = attributeName
    }

    component(): Raw<DefineComponent<any, any, any>> {
        return markRaw(AttributeSchemaViewer as DefineComponent<any, any, any>)
    }

    path(): List<string> {
        return List([this.catalogName, 'attributes', this.attributeName])
    }
}
