import { DefineComponent, markRaw, Raw } from 'vue'
import { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'
import ReferenceSchemaViewer from '@/modules/schema-viewer/viewer/component/reference/ReferenceSchemaViewer.vue'
import { SchemaType } from '@/modules/schema-viewer/viewer/model/SchemaType'

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

    get component(): Raw<DefineComponent<any, any, any>> {
        return markRaw(ReferenceSchemaViewer as DefineComponent<any, any, any>)
    }

    get schemaName(): string {
        return this.referenceName
    }

    get schemaType(): SchemaType {
        return SchemaType.Reference
    }
}
