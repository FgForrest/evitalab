export class ReferenceAttributeSkipToken {
    readonly referenceName: string
    readonly groupEntity: string


    constructor(referenceName: string, groupEntity: string) {
        this.referenceName = referenceName
        this.groupEntity = groupEntity
    }
}
