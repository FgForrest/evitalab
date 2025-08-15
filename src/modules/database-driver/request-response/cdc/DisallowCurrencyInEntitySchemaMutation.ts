import { EntitySchemaMutation } from '@/modules/database-driver/request-response/cdc/EntitySchemaMutation.ts'

export class DisallowCurrencyInEntitySchemaMutation extends EntitySchemaMutation {
    readonly kind = 'disallowCurrencyInEntitySchemaMutation'
    readonly currencies: string[]

    constructor(currencies: string[]) {
        super()
        this.currencies = currencies
    }
}
