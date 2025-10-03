import { List as ImmutableList } from 'immutable'

import {
    AbstractModifyReferenceDataSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/reference/AbstractModifyReferenceDataSchemaMutation.ts'
import type {
    ScopedReferenceIndexType
} from '@/modules/database-driver/request-response/schema/mutation/reference/ScopedReferenceIndexType.ts'

export class SetReferenceSchemaIndexedMutation extends AbstractModifyReferenceDataSchemaMutation {
    readonly indexedInScopes: ImmutableList<ScopedReferenceIndexType>

    constructor(name: string, indexedInScopes: ImmutableList<ScopedReferenceIndexType>) {
        super(name)
        this.indexedInScopes = indexedInScopes
    }
}
