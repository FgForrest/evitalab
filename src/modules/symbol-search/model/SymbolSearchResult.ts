import type { SchemaSymbol } from '@/modules/symbol-search/model/SchemaSymbol'
import type { MatchTier } from '@/modules/symbol-search/model/MatchTier'
import type { MatchRange } from '@/modules/symbol-search/model/MatchRange'

/**
 * One symbol found by a query.
 */
export class SymbolSearchResult {
    readonly symbol: SchemaSymbol
    /** best match quality over all keys of the symbol */
    readonly tier: MatchTier
    /** matched characters of the display name, empty when they cannot be mapped onto it */
    readonly displayRanges: MatchRange[]

    constructor(symbol: SchemaSymbol, tier: MatchTier, displayRanges: MatchRange[]) {
        this.symbol = symbol
        this.tier = tier
        this.displayRanges = displayRanges
    }
}
