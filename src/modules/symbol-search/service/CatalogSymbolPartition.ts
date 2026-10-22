import type { SchemaSymbol } from '@/modules/symbol-search/model/SchemaSymbol'
import type { SymbolKey } from '@/modules/symbol-search/model/SymbolKey'
import {
    createSymbolKey,
    normalizeSymbolName,
    splitSymbolNameIntoWords
} from '@/modules/symbol-search/service/SymbolMatcher'

/**
 * All symbols of one catalog, indexed as `normalized name → symbols`. A partition is filled once by the index
 * builder and then published into the {@link SymbolIndex} as a whole, so a catalog can be re-indexed without
 * touching the others.
 */
export class CatalogSymbolPartition {
    readonly catalogName: string
    /** structural fingerprint of the catalog the partition was built from, see the symbol search service */
    readonly fingerprint: string

    private readonly byKey: Map<string, SymbolKey> = new Map()
    private _symbolCount: number = 0

    constructor(catalogName: string, fingerprint: string) {
        this.catalogName = catalogName
        this.fingerprint = fingerprint
    }

    /**
     * Number of distinct symbols in the partition.
     */
    get symbolCount(): number {
        return this._symbolCount
    }

    /**
     * Number of distinct normalized keys in the partition.
     */
    get keyCount(): number {
        return this.byKey.size
    }

    get keys(): IterableIterator<SymbolKey> {
        return this.byKey.values()
    }

    getKey(normalizedKey: string): SymbolKey | undefined {
        return this.byKey.get(normalizedKey)
    }

    /**
     * Adds a symbol under its display name and every name variant. Variants normalizing to an already present key
     * of the symbol are not added twice.
     */
    add(symbol: SchemaSymbol, nameVariants: Iterable<string>): void {
        this._symbolCount++
        this.addKey(symbol, symbol.name)
        for (const nameVariant of nameVariants) {
            this.addKey(symbol, nameVariant)
        }
    }

    private addKey(symbol: SchemaSymbol, name: string): void {
        const normalizedKey: string = normalizeSymbolName(name)
        if (normalizedKey.length === 0) {
            return
        }
        let symbolKey: SymbolKey | undefined = this.byKey.get(normalizedKey)
        if (symbolKey == undefined) {
            symbolKey = createSymbolKey(name)
            this.byKey.set(normalizedKey, symbolKey)
        } else if (symbolKey.words.length < splitSymbolNameIntoWords(name).length) {
            // the key is shared by names of different conventions (`productcode`, `productCode`): keep the finest
            // word split, whichever name came first, so word-prefix chains keep matching
            const finerKey: SymbolKey = createSymbolKey(name)
            finerKey.symbols.push(...symbolKey.symbols)
            symbolKey = finerKey
            this.byKey.set(normalizedKey, symbolKey)
        }
        if (symbolKey.symbols[symbolKey.symbols.length - 1] !== symbol) {
            symbolKey.symbols.push(symbol)
        }
    }
}
