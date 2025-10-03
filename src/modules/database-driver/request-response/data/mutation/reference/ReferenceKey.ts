export class ReferenceKey {
    readonly referenceName: string
    readonly primaryKey: number


    constructor(referenceName: string, primaryKey: number) {
        this.referenceName = referenceName
        this.primaryKey = primaryKey
    }
}
