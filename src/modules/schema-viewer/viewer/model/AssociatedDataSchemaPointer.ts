import { DefineComponent, markRaw, Raw } from 'vue'
import { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'
import AssociatedDataSchemaViewer
    from '@/modules/schema-viewer/viewer/component/associated-data/AssociatedDataSchemaViewer.vue'
import { SchemaType } from '@/modules/schema-viewer/viewer/model/SchemaType'

/**
 * Points to evitaDB associated data schema nested inside an entity schema.
 */
export class AssociatedDataSchemaPointer implements SchemaPointer {
    readonly catalogName: string
    readonly entityType: string
    readonly associatedDataName: string

    constructor(catalogName: string, entityType: string, associatedDataName: string) {
        this.catalogName = catalogName
        this.entityType = entityType
        this.associatedDataName = associatedDataName
    }

    get component(): Raw<DefineComponent<any, any, any>> {
        return markRaw(AssociatedDataSchemaViewer as DefineComponent<any, any, any>)
    }

    get schemaType(): SchemaType {
        return SchemaType.AssociatedData
    }

    get schemaName(): string {
        return this.associatedDataName
    }
}
