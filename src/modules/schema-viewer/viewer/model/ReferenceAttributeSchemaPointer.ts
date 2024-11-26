import { DefineComponent, markRaw, Raw } from 'vue'
import AttributeSchemaViewer from '@/modules/schema-viewer/viewer/component/attribute/AttributeSchemaViewer.vue'
import { SchemaType } from '@/modules/schema-viewer/viewer/model/SchemaType'
import { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'

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

    get component(): Raw<DefineComponent<any, any, any>> {
        return markRaw(AttributeSchemaViewer as DefineComponent<any, any, any>)
    }

    get schemaName(): string {
        return this.attributeName
    }

    get schemaType(): SchemaType {
        return SchemaType.Attribute
    }
}
