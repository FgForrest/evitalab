import { DefineComponent, markRaw, Raw } from 'vue'
import { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'
import EntitySchemaViewer from '@/modules/schema-viewer/viewer/component/entity/EntitySchemaViewer.vue'
import { SchemaType } from '@/modules/schema-viewer/viewer/model/SchemaType'

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

    get component(): Raw<DefineComponent<any, any, any>> {
        return markRaw(EntitySchemaViewer as DefineComponent<any, any, any>)
    }

    get schemaName(): string {
        return this.entityType
    }

    get schemaType(): SchemaType {
        return SchemaType.Entity
    }
}
