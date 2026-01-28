import { markRaw } from 'vue'
import type { Component, Raw } from 'vue'
import type { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'
import EntitySchemaViewer from '@/modules/schema-viewer/viewer/component/entity/EntitySchemaViewer.vue'
import { SchemaType } from '@/modules/schema-viewer/viewer/model/SchemaType'

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

    get component(): Raw<Component> {
        return markRaw(EntitySchemaViewer as Component)
    }

    get schemaName(): string {
        return this.entityType
    }

    get schemaType(): SchemaType {
        return SchemaType.Entity
    }
}
