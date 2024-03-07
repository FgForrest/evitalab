import { SchemaPointer } from '@/model/editor/tab/schemaViewer/SchemaPointer'
import { DefineComponent, markRaw, Raw } from 'vue'
import LabEditorSchemaViewerAssociatedDatum
    from '@/components/lab/editor/schema-viewer/LabEditorSchemaViewerAssociatedDatum.vue'

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

    component(): Raw<DefineComponent<any, any, any>> {
        return markRaw(LabEditorSchemaViewerAssociatedDatum as DefineComponent<any, any, any>)
    }

    path(): string[] {
        return [this.catalogName, 'entities', this.entityType, 'associated data', this.associatedDataName]
    }
}
