import { List as ImmutableList } from 'immutable'
import type {
    ScopedAttributeUniquenessType
} from '@/modules/database-driver/request-response/cdc/schema/mutation/attribute/ScopedAttributeUniquenessType.ts'

export class SetAttributeSchemaUniqueMutation {
    readonly name: string
    readonly uniqueInScopes: ImmutableList<ScopedAttributeUniquenessType>

    constructor(name: string, uniqueInScopes: ImmutableList<ScopedAttributeUniquenessType>) {
        this.name = name
        this.uniqueInScopes = uniqueInScopes
    }
}
