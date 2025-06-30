import type { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer.ts'
import type { DefineComponent, Raw } from 'vue'
import { SchemaType } from '@/modules/schema-viewer/viewer/model/SchemaType.ts'
import SortableCompoundSchemaViewer
    from '@/modules/schema-viewer/viewer/component/sortable-compound/SortableCompoundSchemaViewer.vue'

export class SortableCompoundSchemaPointer implements SchemaPointer {
    readonly catalogName: string
    readonly entityType: string
    readonly sortableCompoundName: string

    constructor(catalogName: string, entityName: string, sortableCompoundName: string) {
        this.catalogName = catalogName
        this.entityType = entityName
        this.sortableCompoundName = sortableCompoundName
    }

    get component(): Raw<DefineComponent<any, any, any>> {
        return markRaw(SortableCompoundSchemaViewer as DefineComponent<any, any, any>)
    }

    get schemaName(): string {
        return this.sortableCompoundName
    }

    get schemaType(): SchemaType {
        return SchemaType.SortableCompound
    }

}
