import Immutable, { List as ImmutableList } from 'immutable'
import  { type EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'

export class SetEntitySchemaWithPriceMutation {
    readonly withPrice: boolean
    readonly indexedInScopes: ImmutableList<EntityScope>
    readonly indexedWithPlaces: number


    constructor(withPrice: boolean, indexedInScopes: Immutable.List<EntityScope>, indexedWithPlaces: number) {
        this.withPrice = withPrice
        this.indexedInScopes = indexedInScopes
        this.indexedWithPlaces = indexedWithPlaces
    }
}
