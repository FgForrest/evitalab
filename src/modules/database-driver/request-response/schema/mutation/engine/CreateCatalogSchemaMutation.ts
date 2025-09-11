export class CreateCatalogSchemaMutation {
    readonly catalogName: string

    constructor(catalogName: string) {
        this.catalogName = catalogName
    }
}
