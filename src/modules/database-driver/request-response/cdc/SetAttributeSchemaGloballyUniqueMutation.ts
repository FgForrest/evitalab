import {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'
import { List as ImmutableList } from 'immutable'
import type {
    ScopedGlobalAttributeUniquenessType
} from '@/modules/database-driver/request-response/schema/ScopedGlobalAttributeUniquenessType.ts'

export class SetAttributeSchemaGloballyUniqueMutation extends LocalCatalogSchemaMutation {
    readonly kind = 'setAttributeSchemaGloballyUniqueMutation'
    readonly name: string
    readonly uniqueGloballyInScopes: ImmutableList<ScopedGlobalAttributeUniquenessType>

    constructor(name: string, uniqueGloballyInScopes: ImmutableList<ScopedGlobalAttributeUniquenessType>) {
        super()
        this.name = name
        this.uniqueGloballyInScopes = uniqueGloballyInScopes
    }
}
