import Immutable, { List as ImmutableList } from "immutable"
import  {
    type ScopedReferenceIndexType
} from '@/modules/database-driver/request-response/schema/ScopedReferenceIndexType.ts'
import {
    AbstractModifyReferenceDataSchemaMutation
} from '@/modules/database-driver/request-response/cdc/schema/mutation/reference/AbstractModifyReferenceDataSchemaMutation.ts'
export class SetReferenceSchemaIndexedMutation extends AbstractModifyReferenceDataSchemaMutation{
    readonly indexedInScopes: ImmutableList<ScopedReferenceIndexType>

    constructor(name: string, indexedInScopes: Immutable.List<ScopedReferenceIndexType>) {
        super(name)
        this.indexedInScopes = indexedInScopes
    }
}
