import type { CatalogSymbolPartition } from '@/modules/symbol-search/service/CatalogSymbolPartition'
import type { SchemaSymbol } from '@/modules/symbol-search/model/SchemaSymbol'
import type { SymbolKey } from '@/modules/symbol-search/model/SymbolKey'
import { symbolTypeSortRank } from '@/modules/symbol-search/model/SymbolType'
import { SymbolSearchResult } from '@/modules/symbol-search/model/SymbolSearchResult'
import { SymbolSearchResults } from '@/modules/symbol-search/model/SymbolSearchResults'
import type { MatchRange } from '@/modules/symbol-search/model/MatchRange'
import {
    matchSymbolKey,
    normalizeSymbolName,
    normalizeSymbolQuery,
    type SymbolMatch,
    toDisplayRanges
} from '@/modules/symbol-search/service/SymbolMatcher'

/**
 * Upper bound of indexed symbols. A safety net against pathological servers rather than a memory budget — see the
 * module documentation for the measurements behind it.
 */
export const maxIndexedSymbols: number = 50_000

/**
 * Number of results the popup renders at most; the rest is only counted.
 */
const maxRenderedResults: number = 200

/**
 * Best match of one symbol found during a search, before it is turned into a {@link SymbolSearchResult}.
 */
interface SymbolHit {
    readonly symbol: SchemaSymbol
    match: SymbolMatch
    key: SymbolKey
    readonly typeRank: number
}

/**
 * In-memory symbol index of all catalogs of the connection, partitioned per catalog. Searching is a linear scan over
 * the distinct keys of all partitions; every key is matched once no matter how many symbols share it.
 *
 * Pure storage and search: knows nothing about evitaDB or Vue.
 */
export class SymbolIndex {

    private readonly partitions: Map<string, CatalogSymbolPartition> = new Map()

    /**
     * Names of the catalogs that have a published partition.
     */
    get catalogNames(): string[] {
        return Array.from(this.partitions.keys())
    }

    /**
     * Number of distinct symbols in all partitions.
     */
    get symbolCount(): number {
        let count: number = 0
        for (const partition of this.partitions.values()) {
            count += partition.symbolCount
        }
        return count
    }

    /**
     * Number of distinct keys in all partitions.
     */
    get keyCount(): number {
        let count: number = 0
        for (const partition of this.partitions.values()) {
            count += partition.keyCount
        }
        return count
    }

    getPartition(catalogName: string): CatalogSymbolPartition | undefined {
        return this.partitions.get(catalogName)
    }

    /**
     * Publishes the partition of a catalog, replacing the previous one atomically.
     */
    replacePartition(partition: CatalogSymbolPartition): void {
        this.partitions.set(partition.catalogName, partition)
    }

    dropPartition(catalogName: string): void {
        this.partitions.delete(catalogName)
    }

    clear(): void {
        this.partitions.clear()
    }

    /**
     * Finds all symbols matching the query, ordered by symbol type, match quality, name length, name and path.
     *
     * @param query raw user query
     * @param limit maximum number of returned results, the total count is reported regardless
     */
    search(query: string, limit: number = maxRenderedResults): SymbolSearchResults {
        const normalizedQuery: string = normalizeSymbolQuery(query)
        if (normalizedQuery.length === 0) {
            return SymbolSearchResults.empty()
        }

        const hits: Map<SchemaSymbol, SymbolHit> = new Map()
        for (const partition of this.partitions.values()) {
            for (const symbolKey of partition.keys) {
                const match: SymbolMatch | undefined = matchSymbolKey(symbolKey, normalizedQuery)
                if (match == undefined) {
                    continue
                }
                for (const symbol of symbolKey.symbols) {
                    const existingHit: SymbolHit | undefined = hits.get(symbol)
                    if (existingHit == undefined) {
                        hits.set(symbol, {
                            symbol,
                            match,
                            key: symbolKey,
                            typeRank: symbolTypeSortRank(symbol.type)
                        })
                    } else if (match.tier < existingHit.match.tier) {
                        existingHit.match = match
                        existingHit.key = symbolKey
                    }
                }
            }
        }

        const sortedHits: SymbolHit[] = Array.from(hits.values()).sort(compareHits)
        const results: SymbolSearchResult[] = sortedHits
            .slice(0, limit)
            .map(hit => new SymbolSearchResult(hit.symbol, hit.match.tier, resolveDisplayRanges(hit)))
        return new SymbolSearchResults(results, sortedHits.length)
    }
}

/**
 * Names are compared with a plain `<` on the lower-cased name rather than an `Intl.Collator`: schema names are
 * identifiers, and a collator noticeably slows down short queries matching tens of thousands of symbols.
 */
function compareHits(a: SymbolHit, b: SymbolHit): number {
    return (a.typeRank - b.typeRank)
        || (a.match.tier - b.match.tier)
        || (a.symbol.name.length - b.symbol.name.length)
        || compareStrings(a.symbol.sortName, b.symbol.sortName)
        || compareStrings(a.symbol.path.toString(), b.symbol.path.toString())
}

function compareStrings(a: string, b: string): number {
    return a < b ? -1 : (a > b ? 1 : 0)
}

/**
 * Highlight ranges can be mapped onto the display name only when the matched key is the display name's own key,
 * a hit through a differently normalizing name variant is rendered without highlight.
 */
function resolveDisplayRanges(hit: SymbolHit): MatchRange[] {
    if (normalizeSymbolName(hit.symbol.name) !== hit.key.key) {
        return []
    }
    return toDisplayRanges(hit.symbol.name, hit.match.ranges)
}
