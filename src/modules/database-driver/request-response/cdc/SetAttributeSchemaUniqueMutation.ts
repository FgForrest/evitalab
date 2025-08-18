import {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'
import { List as ImmutableList } from 'immutable'
import type {
    ScopedAttributeUniquenessType
} from '@/modules/database-driver/request-response/schema/ScopedAttributeUniquenessType.ts'

export class SetAttributeSchemaUniqueMutation extends LocalCatalogSchemaMutation {
    readonly kind = 'setAttributeSchemaUniqueMutation'
    readonly name: string
    readonly uniqueInScopes: ImmutableList<ScopedAttributeUniquenessType>

    constructor(name: string, uniqueInScopes: ImmutableList<ScopedAttributeUniquenessType>) {
        super()
        this.name = name
        this.uniqueInScopes = uniqueInScopes
    }
}
