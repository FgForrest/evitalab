import {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'

export class SetAttributeSchemaRepresentativeMutation extends LocalCatalogSchemaMutation {
    readonly kind = 'setAttributeSchemaRepresentativeMutation'
    readonly name: string
    readonly representative: boolean

    constructor(name: string, representative: boolean) {
        super()
        this.name = name
        this.representative = representative
    }
}
