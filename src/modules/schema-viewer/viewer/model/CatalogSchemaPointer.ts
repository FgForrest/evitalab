import { DefineComponent, markRaw, Raw } from 'vue'
import { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'
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

    get component(): Raw<DefineComponent<any, any, any>> {
        return markRaw(CatalogSchemaViewer as DefineComponent<any, any, any>)
    }

    get schemaName(): string {
        return this.catalogName
    }

    get schemaType(): SchemaType {
        return SchemaType.Catalog
    }
}
