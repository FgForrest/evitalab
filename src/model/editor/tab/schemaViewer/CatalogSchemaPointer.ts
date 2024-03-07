import { SchemaPointer } from '@/model/editor/tab/schemaViewer/SchemaPointer'
import { DefineComponent, markRaw, Raw } from 'vue'
import LabEditorSchemaViewerCatalog from '@/components/lab/editor/schema-viewer/LabEditorSchemaViewerCatalog.vue'

/**
 * Points to concrete evitaDB catalog schema
 */
export class CatalogSchemaPointer implements SchemaPointer {
    readonly catalogName: string

    constructor(catalogName: string) {
        this.catalogName = catalogName
    }

    component(): Raw<DefineComponent<any, any, any>> {
        return markRaw(LabEditorSchemaViewerCatalog as DefineComponent<any, any, any>)
    }

    path(): string[] {
        return [this.catalogName]
    }
}
