import { SchemaPointer } from '@/model/editor/tab/schemaViewer/SchemaPointer'
import { DefineComponent, markRaw, Raw } from 'vue'
import LabEditorSchemaViewerReference from '@/components/lab/editor/schema-viewer/LabEditorSchemaViewerReference.vue'

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
        return markRaw(LabEditorSchemaViewerReference as DefineComponent<any, any, any>)
    }

    path(): string[] {
        return [this.catalogName, 'entities', this.entityType, 'references', this.referenceName]
    }
}
