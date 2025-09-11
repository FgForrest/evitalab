export class SetReferenceGroupMutation {
    readonly resolvedGroupType: string
    readonly groupPrimaryKey: number
    readonly groupType: string

    constructor(resolvedGroupType: string, groupPrimaryKey: number, groupType: string) {
        this.resolvedGroupType = resolvedGroupType
        this.groupPrimaryKey = groupPrimaryKey
        this.groupType = groupType
    }
}
