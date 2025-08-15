import { EntitySchemaMutation } from '@/modules/database-driver/request-response/cdc/EntitySchemaMutation.ts'

export class SetEntitySchemaWithPriceMutation extends EntitySchemaMutation {
    readonly kind = 'setEntitySchemaWithPriceMutation'
    readonly withPrice: boolean
    readonly indexedPricePlaces: number

    constructor(withPrice: boolean, indexedPricePlaces: number) {
        super()
        this.withPrice = withPrice
        this.indexedPricePlaces = indexedPricePlaces
    }
}
