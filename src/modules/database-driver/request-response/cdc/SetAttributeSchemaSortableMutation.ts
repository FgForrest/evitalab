import {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'

export class SetAttributeSchemaSortableMutation extends LocalCatalogSchemaMutation {
    readonly kind = 'setAttributeSchemaSortableMutation'
    readonly name: string
    readonly sortable: boolean

    constructor(name: string, sortable: boolean) {
        super()
        this.name = name
        this.sortable = sortable
    }
}
