import { ParentMutation } from '@/modules/database-driver/request-response/data/mutation/parent/ParentMutation.ts'

export class SetParentMutation extends ParentMutation {

    private readonly parentPrimaryKey: number

    constructor(parentPrimaryKey: number) {
        super()
        this.parentPrimaryKey = parentPrimaryKey
    }
}
