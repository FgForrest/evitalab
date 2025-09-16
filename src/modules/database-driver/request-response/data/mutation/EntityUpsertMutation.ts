import {
    EntityExistence,
    type EntityMutation
} from '@/modules/database-driver/request-response/data/mutation/EntityMutation.ts'
import type {
    EntityRemoveMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/EntityRemoveMutationConverter.ts'
import type { LocalMutation } from '@/modules/database-driver/request-response/data/mutation/LocalMutation.ts'
import { List as ImmutableList } from 'immutable'

export class EntityUpsertMutation implements EntityMutation {

    private readonly entityPrimaryKey: number |undefined
    private readonly entityType: string
    private readonly entityExistence: EntityExistence
    private readonly localMutations: ImmutableList<LocalMutation>


    constructor(entityPrimaryKey: number | undefined, entityType: string, entityExistence: EntityExistence, localMutations: ImmutableList<LocalMutation>) {
        this.entityPrimaryKey = entityPrimaryKey
        this.entityType = entityType
        this.entityExistence = entityExistence
        this.localMutations = localMutations || ImmutableList([])
    }
}
