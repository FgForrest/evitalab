import type { SchemaSymbol } from '@/modules/symbol-search/model/SchemaSymbol'

/**
 * One entry of the symbol index: a normalized name together with every symbol carrying it (or one of its name
 * variants). Matching runs once per key, not once per symbol, which is the point of grouping symbols this way.
 *
 * `symbols` is a plain array filled while a partition is being built, the key is never changed after the
 * partition is published.
 */
export class SymbolKey {
    /** name lower-cased with `-`, `_` and spaces removed */
    readonly key: string
    /** lower-cased words of the name, `words.join('') === key` */
    readonly words: string[]
    /** offsets of the words in {@link key} */
    readonly wordStarts: number[]
    /** bit set of the first letters (a–z) of the words, a cheap prefilter of word-prefix chains */
    readonly initialsMask: number
    /** every symbol carrying this name */
    readonly symbols: SchemaSymbol[] = []

    constructor(key: string, words: string[], wordStarts: number[], initialsMask: number) {
        this.key = key
        this.words = words
        this.wordStarts = wordStarts
        this.initialsMask = initialsMask
    }
}
