import {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'

export class SetAttributeSchemaNullableMutation extends LocalCatalogSchemaMutation {
    readonly kind = 'setAttributeSchemaNullableMutation'
    readonly name: string
    readonly nullable: boolean

    constructor(name: string, nullable: boolean) {
        super()
        this.name = name
        this.nullable = nullable
    }
}
