import type { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer.ts'
import type { DefineComponent, Raw } from 'vue'
import { SchemaType } from '@/modules/schema-viewer/viewer/model/SchemaType.ts'
import SortableAttributeCompoundSchemaViewer
    from '@/modules/schema-viewer/viewer/component/sortable-compound/SortableAttributeCompoundSchemaViewer.vue'

export class SortableAttributeCompoundSchemaPointer implements SchemaPointer {
    readonly catalogName: string
    readonly entityType: string
    readonly sortableAttributeCompoundName: string

    constructor(catalogName: string, entityName: string, sortableCompoundName: string) {
        this.catalogName = catalogName
        this.entityType = entityName
        this.sortableAttributeCompoundName = sortableCompoundName
    }

    get component(): Raw<DefineComponent<any, any, any>> {
        return markRaw(SortableAttributeCompoundSchemaViewer as DefineComponent<any, any, any>)
    }

    get schemaName(): string {
        return this.sortableAttributeCompoundName
    }

    get schemaType(): SchemaType {
        return SchemaType.SortableAttributeCompounds
    }

}
