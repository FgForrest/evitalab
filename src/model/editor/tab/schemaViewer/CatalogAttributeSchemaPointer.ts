import { SchemaPointer } from '@/model/editor/tab/schemaViewer/SchemaPointer'
import { DefineComponent, markRaw, Raw } from 'vue'
import LabEditorSchemaViewerAttribute from '@/components/lab/editor/schema-viewer/LabEditorSchemaViewerAttribute.vue'

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
        return markRaw(LabEditorSchemaViewerAttribute as DefineComponent<any, any, any>)
    }

    path(): string[] {
        return [this.catalogName, 'attributes', this.attributeName]
    }
}
