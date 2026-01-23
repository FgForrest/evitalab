import {
    type EntityMutation
} from '@/modules/database-driver/request-response/data/mutation/EntityMutation.ts'

export class EntityRemoveMutation implements EntityMutation {

    private readonly entityType: string
    private readonly entityPrimaryKey: number |undefined


    constructor(entityType: string, entityPrimaryKey: number | undefined) {
        this.entityType = entityType
        this.entityPrimaryKey = entityPrimaryKey
    }
}
