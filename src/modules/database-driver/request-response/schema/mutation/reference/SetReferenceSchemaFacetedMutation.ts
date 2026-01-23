import { List as ImmutableList } from 'immutable'
import { EntityScope, EntityScopeDefaults, EntityScopeNone } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import {
    AbstractModifyReferenceDataSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/reference/AbstractModifyReferenceDataSchemaMutation.ts'

export class SetReferenceSchemaFacetedMutation extends AbstractModifyReferenceDataSchemaMutation {
    readonly facetedInScopes: ImmutableList<EntityScope>

    constructor(name: string, facetedInScopes: ImmutableList<EntityScope>|undefined) {
        super(name)
        this.facetedInScopes = ImmutableList(facetedInScopes ? EntityScopeDefaults : EntityScopeNone)
    }
}
