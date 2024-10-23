import { DefineComponent, markRaw, Raw } from 'vue'
import { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'
import ReferenceSchemaViewer from '@/modules/schema-viewer/viewer/component/reference/ReferenceSchemaViewer.vue'
import { List } from 'immutable'

/**
 * Points to evitaDB reference schema nested inside an entity schema.
 */
export class ReferenceSchemaPointer implements SchemaPointer {
    readonly catalogName: string
    readonly entityType: string
    readonly referenceName: string

    constructor(catalogName: string, entityType: string, referenceName: string) {
        this.catalogName = catalogName
        this.entityType = entityType
        this.referenceName = referenceName
    }

    component(): Raw<DefineComponent<any, any, any>> {
        return markRaw(ReferenceSchemaViewer as DefineComponent<any, any, any>)
    }

    path(): List<string> {
        return List([this.catalogName, 'entities', this.entityType, 'references', this.referenceName])
    }
}
