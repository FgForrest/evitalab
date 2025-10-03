import { Set as ImmutableSet } from 'immutable'
import type { Currency } from '@/modules/database-driver/data-type/Currency.ts'

export class DisallowCurrencyInEntitySchemaMutation {
    readonly currencies: ImmutableSet<Currency>

    constructor(currencies: ImmutableSet<Currency>) {
        this.currencies = currencies
    }
}
