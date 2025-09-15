import Immutable, { List as ImmutableList } from 'immutable'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import {
    AbstractModifyReferenceDataSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/reference/AbstractModifyReferenceDataSchemaMutation.ts'

export class SetReferenceSchemaFacetedMutation extends AbstractModifyReferenceDataSchemaMutation {
    readonly facetedInScopes: ImmutableList<EntityScope>

    constructor(name: string, facetedInScopes: Immutable.List<EntityScope>|undefined) {
        super(name)
        this.facetedInScopes = Immutable.List(facetedInScopes ? EntityScope.DefaultScopes : EntityScope.NoScope)
    }
}
