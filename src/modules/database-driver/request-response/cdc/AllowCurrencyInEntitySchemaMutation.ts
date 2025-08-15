import { EntitySchemaMutation } from '@/modules/database-driver/request-response/cdc/EntitySchemaMutation.ts'
import { List as ImmutableList} from 'immutable'

export class AllowCurrencyInEntitySchemaMutation extends EntitySchemaMutation {
    readonly kind = 'allowCurrencyInEntitySchemaMutation'
    readonly currencies: ImmutableList<string>

    constructor(currencies: ImmutableList<string>) {
        super()
        this.currencies = currencies
    }
}
