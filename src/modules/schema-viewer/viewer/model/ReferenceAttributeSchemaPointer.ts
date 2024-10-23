import { DefineComponent, markRaw, Raw } from 'vue'
import { ReferenceSchemaPointer } from '@/modules/schema-viewer/viewer/model/ReferenceSchemaPointer'
import AttributeSchemaViewer from '@/modules/schema-viewer/viewer/component/attribute/AttributeSchemaViewer.vue'
import { List } from 'immutable'

/**
 * Points to evitaDB attribute schema nested inside a reference schema.
 */
export class ReferenceAttributeSchemaPointer extends ReferenceSchemaPointer {
    readonly attributeName: string

    constructor(catalogName: string, entityType: string, referenceName: string, attributeName: string) {
        super(catalogName, entityType, referenceName)
        this.attributeName = attributeName
    }

    component(): Raw<DefineComponent<any, any, any>> {
        return markRaw(AttributeSchemaViewer as DefineComponent<any, any, any>)
    }

    path(): List<string> {
        return List([this.catalogName, 'entities', this.entityType, 'references', this.referenceName, 'attributes', this.attributeName])
    }
}
