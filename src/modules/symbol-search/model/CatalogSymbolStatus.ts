import type { CatalogState } from '@/modules/database-driver/request-response/CatalogState'

/**
 * State of a catalog as known when its symbols were indexed. Decides which actions of a catalog symbol are
 * enabled and which icon it gets.
 */
export class CatalogSymbolStatus {
    readonly state: CatalogState
    readonly unusable: boolean
    readonly readOnly: boolean

    constructor(state: CatalogState, unusable: boolean, readOnly: boolean) {
        this.state = state
        this.unusable = unusable
        this.readOnly = readOnly
    }
}
