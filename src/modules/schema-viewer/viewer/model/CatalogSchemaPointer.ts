import { markRaw } from 'vue'
import type { Component, Raw } from 'vue'
import type { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'
import CatalogSchemaViewer from '@/modules/schema-viewer/viewer/component/catalog/CatalogSchemaViewer.vue'
import { SchemaType } from '@/modules/schema-viewer/viewer/model/SchemaType'

/**
 * Points to concrete evitaDB catalog schema
 */
export class CatalogSchemaPointer implements SchemaPointer {
    readonly catalogName: string

    constructor(catalogName: string) {
        this.catalogName = catalogName
    }

    get component(): Raw<Component> {
        return markRaw(CatalogSchemaViewer as Component)
    }

    get schemaName(): string {
        return this.catalogName
    }

    get schemaType(): SchemaType {
        return SchemaType.Catalog
    }
}
