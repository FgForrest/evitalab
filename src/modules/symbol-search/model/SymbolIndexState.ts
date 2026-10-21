/**
 * Lifecycle phase of the symbol index.
 */
export enum SymbolIndexStatus {
    /** nothing indexed yet, the index is built on the first open of the popup */
    Idle = 'idle',
    /** catalogs are being (re)indexed, partitions already published are searchable */
    Building = 'building',
    /** every catalog is indexed */
    Ready = 'ready',
    /** indexing stopped at the symbol limit, some catalogs are not searchable */
    LimitExceeded = 'limitExceeded',
    /** the catalog listing could not be read at all */
    Failed = 'failed'
}

/**
 * Snapshot of the symbol index state, rendered by the popup and the status bar indicator.
 */
export class SymbolIndexState {
    readonly status: SymbolIndexStatus
    /** number of indexed symbols */
    readonly symbolCount: number
    /** catalogs already (re)indexed in the running build */
    readonly builtCatalogs: number
    /** catalogs the running build has to (re)index */
    readonly catalogsToBuild: number
    /** catalog being indexed right now */
    readonly currentCatalog: string | undefined
    /** number of catalogs left out because of the symbol limit */
    readonly truncatedCatalogs: number
    /** cause of a failed build */
    readonly error: Error | undefined

    constructor(status: SymbolIndexStatus,
                symbolCount: number = 0,
                builtCatalogs: number = 0,
                catalogsToBuild: number = 0,
                currentCatalog?: string,
                truncatedCatalogs: number = 0,
                error?: Error) {
        this.status = status
        this.symbolCount = symbolCount
        this.builtCatalogs = builtCatalogs
        this.catalogsToBuild = catalogsToBuild
        this.currentCatalog = currentCatalog
        this.truncatedCatalogs = truncatedCatalogs
        this.error = error
    }

    static idle(): SymbolIndexState {
        return new SymbolIndexState(SymbolIndexStatus.Idle)
    }

    get building(): boolean {
        return this.status === SymbolIndexStatus.Building
    }
}
