/**
 * Upgrades a catalog's on-disk storage protocol, driving the state transitions
 * `OUT_OF_DATE` → `BEING_UPGRADED` → prior operational state. The protocol versions are carried
 * for observability only.
 */
export class UpgradeCatalogFormatMutation {
    readonly catalogName: string
    readonly fromProtocolVersion: number
    readonly toProtocolVersion: number

    constructor(catalogName: string, fromProtocolVersion: number, toProtocolVersion: number) {
        this.catalogName = catalogName
        this.fromProtocolVersion = fromProtocolVersion
        this.toProtocolVersion = toProtocolVersion
    }
}
