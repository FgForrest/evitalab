import Immutable, { List as ImmutableList } from 'immutable'
import  { type EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import {
    AbstractModifyReferenceDataSchemaMutation
} from '@/modules/database-driver/request-response/cdc/schema/mutation/reference/AbstractModifyReferenceDataSchemaMutation.ts'

export class SetReferenceSchemaFacetedMutation extends AbstractModifyReferenceDataSchemaMutation{
    readonly facetedInScopes: ImmutableList<EntityScope>

    constructor(name: string, facetedInScopes: Immutable.List<EntityScope>) {
        super(name)
        this.facetedInScopes = facetedInScopes
    }
}
