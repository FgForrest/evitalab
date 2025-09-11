export class ModifyCatalogSchemaNameMutation {
    readonly catalogName: string
    readonly newCatalogName: string
    readonly overwriteTarget: boolean


    constructor(catalogName: string, newCatalogName: string, overwriteTarget: boolean) {
        this.catalogName = catalogName
        this.newCatalogName = newCatalogName
        this.overwriteTarget = overwriteTarget
    }
}
