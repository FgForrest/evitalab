import { List as ImmutableList } from 'immutable'
import type {
    ScopedGlobalAttributeUniquenessType
} from '@/modules/database-driver/request-response/schema/mutation/attribute/ScopedGlobalAttributeUniquenessType.ts'

export class SetAttributeSchemaGloballyUniqueMutation {
    readonly name: string
    readonly uniqueGloballyInScopes: ImmutableList<ScopedGlobalAttributeUniquenessType>

    constructor(name: string, uniqueGloballyInScopes: ImmutableList<ScopedGlobalAttributeUniquenessType>) {
        this.name = name
        this.uniqueGloballyInScopes = uniqueGloballyInScopes
    }
}
