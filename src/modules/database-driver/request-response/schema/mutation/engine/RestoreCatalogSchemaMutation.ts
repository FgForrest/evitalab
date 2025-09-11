export class RestoreCatalogSchemaMutation {
    readonly catalogName: string

    constructor(catalogName: string) {
        this.catalogName = catalogName
    }
}
