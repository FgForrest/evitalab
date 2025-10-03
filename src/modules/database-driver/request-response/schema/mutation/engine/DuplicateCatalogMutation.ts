export class DuplicateCatalogMutation {
    readonly catalogName: string
    readonly newCatalogName: string

    constructor(catalogName: string, newCatalogName: string) {
        this.catalogName = catalogName
        this.newCatalogName = newCatalogName
    }
}
