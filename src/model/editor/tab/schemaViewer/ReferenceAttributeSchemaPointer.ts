import { SchemaPointer } from '@/model/editor/tab/schemaViewer/SchemaPointer'
import { DefineComponent, markRaw, Raw } from 'vue'
import LabEditorSchemaViewerAttribute from '@/components/lab/editor/schema-viewer/LabEditorSchemaViewerAttribute.vue'

/**
 * Points to evitaDB attribute schema nested inside a reference schema.
 */
export class ReferenceAttributeSchemaPointer implements SchemaPointer {
    readonly catalogName: string
    readonly entityType: string
    readonly referenceName: string
    readonly attributeName: string

    constructor(catalogName: string, entityType: string, referenceName: string, attributeName: string) {
        this.catalogName = catalogName
        this.entityType = entityType
        this.referenceName = referenceName
        this.attributeName = attributeName
    }

    component(): Raw<DefineComponent<any, any, any>> {
        return markRaw(LabEditorSchemaViewerAttribute as DefineComponent<any, any, any>)
    }

    path(): string[] {
        return [this.catalogName, 'entities', this.entityType, 'references', this.referenceName, 'attributes', this.attributeName]
    }
}
