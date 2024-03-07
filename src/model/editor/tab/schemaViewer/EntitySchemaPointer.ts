import { SchemaPointer } from '@/model/editor/tab/schemaViewer/SchemaPointer'
import { DefineComponent, markRaw, Raw } from 'vue'
import LabEditorSchemaViewerEntity from '@/components/lab/editor/schema-viewer/LabEditorSchemaViewerEntity.vue'

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
        return markRaw(LabEditorSchemaViewerEntity as DefineComponent<any, any, any>)
    }

    path(): string[] {
        return [this.catalogName, 'entities', this.entityType]
    }
}
