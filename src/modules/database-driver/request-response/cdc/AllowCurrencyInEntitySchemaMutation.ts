import { EntitySchemaMutation } from '@/modules/database-driver/request-response/cdc/EntitySchemaMutation.ts'

export class AllowCurrencyInEntitySchemaMutation extends EntitySchemaMutation {
    readonly kind = 'allowCurrencyInEntitySchemaMutation'
    readonly currencies: string[]

    constructor(currencies: string[]) {
        super()
        this.currencies = currencies
    }
}
