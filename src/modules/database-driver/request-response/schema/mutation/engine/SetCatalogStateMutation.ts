export class SetCatalogStateMutation {
    readonly catalogName: string
    readonly active: boolean

    constructor(catalogName: string, mutable: boolean) {
        this.catalogName = catalogName
        this.active = mutable
    }
}
