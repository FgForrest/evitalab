export class ApplyMutationWithProgressResponse {
    readonly progressInPercent: number
    readonly catalogVersion?: bigint
    readonly catalogSchemaVersion?: number


    constructor(progressInPercent: number, catalogVersion?: bigint, catalogSchemaVersion?: number) {
        this.progressInPercent = progressInPercent
        this.catalogVersion = catalogVersion
        this.catalogSchemaVersion = catalogSchemaVersion
    }
}
