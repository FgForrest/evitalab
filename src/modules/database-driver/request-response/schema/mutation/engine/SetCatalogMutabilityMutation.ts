export class SetCatalogMutabilityMutation {
    readonly catalogName: string
    readonly mutable: boolean

    constructor(catalogName: string, mutable: boolean) {
        this.catalogName = catalogName
        this.mutable = mutable
    }
}
