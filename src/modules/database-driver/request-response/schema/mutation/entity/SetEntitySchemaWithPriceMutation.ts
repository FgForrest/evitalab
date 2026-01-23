import { type EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import { List as ImmutableList } from 'immutable'

export class SetEntitySchemaWithPriceMutation {
    readonly withPrice: boolean
    readonly indexedInScopes: ImmutableList<EntityScope>
    readonly indexedWithPlaces: number


    constructor(withPrice: boolean, indexedInScopes: ImmutableList<EntityScope>, indexedWithPlaces: number) {
        this.withPrice = withPrice
        this.indexedInScopes = indexedInScopes
        this.indexedWithPlaces = indexedWithPlaces
    }
}
