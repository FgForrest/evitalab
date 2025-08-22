import { EntitySchemaMutation } from '@/modules/database-driver/request-response/cdc/EntitySchemaMutation.ts'
import { List as ImmutableList} from 'immutable'
import type { Currency } from '@/modules/database-driver/data-type/Currency.ts'

export class AllowCurrencyInEntitySchemaMutation extends EntitySchemaMutation {
    readonly kind = 'allowCurrencyInEntitySchemaMutation'
    readonly currencies: ImmutableList<Currency>

    constructor(currencies: ImmutableList<Currency>) {
        super()
        this.currencies = currencies
    }
}
