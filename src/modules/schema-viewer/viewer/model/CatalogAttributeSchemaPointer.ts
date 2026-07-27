import { markRaw } from 'vue'
import type { Component, Raw } from 'vue'
import type { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'
import AttributeSchemaViewer from '@/modules/schema-viewer/viewer/component/attribute/AttributeSchemaViewer.vue'
import { SchemaType } from '@/modules/schema-viewer/viewer/model/SchemaType'

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

    get component(): Raw<Component> {
        return markRaw(AttributeSchemaViewer as Component)
    }

    get schemaName(): string {
        return this.attributeName
    }

    get schemaType(): SchemaType {
        return SchemaType.Attribute
    }
}
