import { DefineComponent, markRaw, Raw } from 'vue'
import { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'
import EntitySchemaViewer from '@/modules/schema-viewer/viewer/component/entity/EntitySchemaViewer.vue'
import { List } from 'immutable'

/**
 * Points to concrete evitaDB entity schema nested inside a catalog schema.
 */
export class EntitySchemaPointer implements SchemaPointer {
    readonly catalogName: string
    readonly entityType: string

    constructor(catalogName: string, entityName: string) {
        this.catalogName = catalogName
        this.entityType = entityName
    }

    component(): Raw<DefineComponent<any, any, any>> {
        return markRaw(EntitySchemaViewer as DefineComponent<any, any, any>)
    }

    path(): List<string> {
        return List([this.catalogName, 'entities', this.entityType])
    }
}
