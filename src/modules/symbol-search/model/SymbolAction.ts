import type { SymbolActionType } from '@/modules/symbol-search/model/SymbolActionType'
import type { SymbolActionDisabledReason } from '@/modules/symbol-search/model/SymbolActionDisabledReason'

/**
 * An action offered for a particular symbol, with the reason why it is not available, if it is not.
 */
export class SymbolAction {
    readonly type: SymbolActionType
    readonly disabledReason: SymbolActionDisabledReason | undefined

    constructor(type: SymbolActionType, disabledReason?: SymbolActionDisabledReason) {
        this.type = type
        this.disabledReason = disabledReason
    }

    get enabled(): boolean {
        return this.disabledReason == undefined
    }
}
