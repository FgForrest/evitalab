import { List as ImmutableList } from 'immutable'
import type { Currency } from '@/modules/database-driver/data-type/Currency.ts'

export class AllowCurrencyInEntitySchemaMutation {
    readonly currencies: ImmutableList<Currency>

    constructor(currencies: ImmutableList<Currency>) {
        this.currencies = currencies
    }
}
