import {
    EntityExistence,
    type EntityMutation
} from '@/modules/database-driver/request-response/data/mutation/EntityMutation.ts'
import type { LocalMutation } from '@/modules/database-driver/request-response/data/mutation/LocalMutation.ts'
import { List as ImmutableList } from 'immutable'

export class EntityUpsertMutation implements EntityMutation {

    private readonly entityPrimaryKey: number |undefined
    private readonly entityType: string
    public readonly entityExistence: EntityExistence
    public readonly localMutations: ImmutableList<LocalMutation>


    constructor(entityPrimaryKey: number | undefined, entityType: string, entityExistence: EntityExistence, localMutations: ImmutableList<LocalMutation>) {
        this.entityPrimaryKey = entityPrimaryKey
        this.entityType = entityType
        this.entityExistence = entityExistence
        this.localMutations = localMutations || ImmutableList([])
    }
}
