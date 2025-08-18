import {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'
import { List as ImmutableList } from 'immutable'
import type { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'

export class SetAttributeSchemaSortableMutation extends LocalCatalogSchemaMutation {
    readonly kind = 'setAttributeSchemaSortableMutation'
    readonly name: string
    readonly sortableInScopes: ImmutableList<EntityScope>

    constructor(name: string, sortableInScopes: ImmutableList<EntityScope>) {
        super()
        this.name = name
        this.sortableInScopes = sortableInScopes
    }
}
