/**
 * Records that a catalog's on-disk folder is no longer present, moving the catalog to the
 * `MISSING` state. The catalog stays registered with the engine but its schema is no longer
 * servable.
 */
export class MarkCatalogMissingMutation {
    readonly catalogName: string

    constructor(catalogName: string) {
        this.catalogName = catalogName
    }
}
