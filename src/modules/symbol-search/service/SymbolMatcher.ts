import { SymbolKey } from '@/modules/symbol-search/model/SymbolKey'
import { MatchTier } from '@/modules/symbol-search/model/MatchTier'
import type { MatchRange } from '@/modules/symbol-search/model/MatchRange'

/**
 * Result of matching a query against one {@link SymbolKey}.
 */
export interface SymbolMatch {
    readonly tier: MatchTier
    /** matched characters in the coordinates of the normalized key, ascending and non-overlapping */
    readonly ranges: MatchRange[]
}

const separatorPattern: RegExp = /[\s_-]+/g
const letterCodeA: number = 'a'.charCodeAt(0)
const letterCodeZ: number = 'z'.charCodeAt(0)

/** decision cells of the word-prefix chain memo */
const memoUnknown: number = -2
const memoFail: number = -1
const memoSkip: number = 0

/**
 * Normalizes a symbol name into its index key: lower-cased, `-`, `_` and whitespace removed.
 */
export function normalizeSymbolName(name: string): string {
    return name.toLowerCase().replace(separatorPattern, '')
}

/**
 * Normalizes a user query the same way as symbol names are normalized.
 */
export function normalizeSymbolQuery(query: string): string {
    return normalizeSymbolName(query)
}

/**
 * Splits a name in any naming convention into lower-cased words: on camelCase humps, acronym ends,
 * digit↔letter boundaries, `-`, `_` and whitespace.
 */
export function splitSymbolNameIntoWords(name: string): string[] {
    return name
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .replace(/([a-zA-Z])([0-9])/g, '$1 $2')
        .replace(/([0-9])([a-zA-Z])/g, '$1 $2')
        .split(separatorPattern)
        .filter(word => word.length > 0)
        .map(word => word.toLowerCase())
}

/**
 * Bit set of the first letters of the words. Words starting with anything but `a`–`z` contribute nothing.
 */
export function initialsMaskOf(words: string[]): number {
    let mask: number = 0
    for (const word of words) {
        const bit: number | undefined = letterBit(word.charCodeAt(0))
        if (bit != undefined) {
            mask |= bit
        }
    }
    return mask
}

/**
 * Creates an index key of a symbol name (or one of its name variants).
 */
export function createSymbolKey(name: string): SymbolKey {
    const words: string[] = splitSymbolNameIntoWords(name)
    const wordStarts: number[] = []
    let offset: number = 0
    for (const word of words) {
        wordStarts.push(offset)
        offset += word.length
    }
    return new SymbolKey(words.join(''), words, wordStarts, initialsMaskOf(words))
}

/**
 * Matches a normalized query against a key and classifies the match into a {@link MatchTier}.
 *
 * @param symbolKey key to match
 * @param query query normalized by {@link normalizeSymbolQuery}
 * @return the best match or undefined if the key does not match at all
 */
export function matchSymbolKey(symbolKey: SymbolKey, query: string): SymbolMatch | undefined {
    if (query.length === 0) {
        return undefined
    }
    const key: string = symbolKey.key
    const substringOffset: number = key.indexOf(query)
    if (substringOffset === 0) {
        return {
            tier: key.length === query.length ? MatchTier.Exact : MatchTier.Prefix,
            ranges: [[0, query.length]]
        }
    }
    if (substringOffset > 0) {
        for (const wordStart of symbolKey.wordStarts) {
            if (wordStart > 0 && key.startsWith(query, wordStart)) {
                return { tier: MatchTier.WordStart, ranges: [[wordStart, wordStart + query.length]] }
            }
        }
    }

    const queryInitialBit: number | undefined = letterBit(query.charCodeAt(0))
    if ((queryInitialBit == undefined || (symbolKey.initialsMask & queryInitialBit) !== 0) &&
        isSubsequence(query, key)) {
        const chainMatch: SymbolMatch | undefined = matchWordPrefixChain(symbolKey, query)
        if (chainMatch != undefined) {
            return chainMatch
        }
    }

    if (substringOffset > 0) {
        return { tier: MatchTier.Substring, ranges: [[substringOffset, substringOffset + query.length]] }
    }
    return undefined
}

/**
 * Tests whether the query can be cut into consecutive non-empty pieces, each being a prefix of a later word of the
 * key than the previous piece (`pv` → **p**arameter**V**alue, `parval` → **par**ameter**Val**ue). A cut without
 * skipped words is preferred ({@link MatchTier.WordPrefixChain}); only when none exists, words in between may be
 * skipped ({@link MatchTier.WordPrefixChainWithSkips}).
 *
 * A greedy longest-prefix cut is not enough (`sorder` vs. `sort|order`), so every piece length is tried and the
 * sub-results are memoized per (word index, query offset).
 *
 * @param symbolKey key to match
 * @param query normalized query
 */
export function matchWordPrefixChain(symbolKey: SymbolKey, query: string): SymbolMatch | undefined {
    if (query.length === 0 || symbolKey.words.length === 0) {
        return undefined
    }
    return runWordPrefixChain(symbolKey, query, false) ?? runWordPrefixChain(symbolKey, query, true)
}

/**
 * Maps ranges in normalized-key coordinates onto the display name, which may contain the separators the key
 * stripped. Adjacent ranges are merged, a range crossing a separator is split around it.
 *
 * Valid only when the display name normalizes to the very key the ranges were computed for.
 */
export function toDisplayRanges(displayName: string, ranges: MatchRange[]): MatchRange[] {
    const normalizedToDisplay: number[] = []
    for (let i = 0; i < displayName.length; i++) {
        if (!isSeparator(displayName.charAt(i))) {
            normalizedToDisplay.push(i)
        }
    }

    const displayRanges: MatchRange[] = []
    for (const [start, end] of ranges) {
        for (let normalizedIndex = start; normalizedIndex < end; normalizedIndex++) {
            const displayIndex: number | undefined = normalizedToDisplay[normalizedIndex]
            if (displayIndex == undefined) {
                continue
            }
            const last: MatchRange | undefined = displayRanges[displayRanges.length - 1]
            if (last != undefined && last[1] === displayIndex) {
                last[1] = displayIndex + 1
            } else {
                displayRanges.push([displayIndex, displayIndex + 1])
            }
        }
    }
    return displayRanges
}

function runWordPrefixChain(symbolKey: SymbolKey, query: string, allowSkip: boolean): SymbolMatch | undefined {
    const words: string[] = symbolKey.words
    const width: number = query.length + 1
    // memo[i * width + j]: decision for matching query[j..] starting at word i
    const memo: Int16Array = new Int16Array(words.length * width).fill(memoUnknown)

    const matchFrom = (wordIndex: number, queryOffset: number): boolean => {
        if (queryOffset === query.length) {
            return true
        }
        if (wordIndex === words.length) {
            return false
        }
        const cell: number = wordIndex * width + queryOffset
        const known: number = memo[cell] ?? memoUnknown
        if (known !== memoUnknown) {
            return known !== memoFail
        }

        const word: string = words[wordIndex] ?? ''
        let decision: number = memoFail
        const maxPieceLength: number = Math.min(word.length, query.length - queryOffset)
        for (let pieceLength = 1; pieceLength <= maxPieceLength; pieceLength++) {
            if (query.charCodeAt(queryOffset + pieceLength - 1) !== word.charCodeAt(pieceLength - 1)) {
                break
            }
            if (matchFrom(wordIndex + 1, queryOffset + pieceLength)) {
                decision = pieceLength
                break
            }
        }
        if (decision === memoFail && allowSkip && matchFrom(wordIndex + 1, queryOffset)) {
            decision = memoSkip
        }
        memo[cell] = decision
        return decision !== memoFail
    }

    const collectRanges = (startWord: number): MatchRange[] => {
        const ranges: MatchRange[] = []
        let wordIndex: number = startWord
        let queryOffset: number = 0
        while (queryOffset < query.length) {
            const decision: number = memo[wordIndex * width + queryOffset] ?? memoFail
            if (decision === memoFail) {
                break
            }
            if (decision > 0) {
                const wordStart: number = symbolKey.wordStarts[wordIndex] ?? 0
                ranges.push([wordStart, wordStart + decision])
                queryOffset += decision
            }
            wordIndex++
        }
        return ranges
    }

    if (allowSkip) {
        // skipping covers every start word
        return matchFrom(0, 0)
            ? { tier: MatchTier.WordPrefixChainWithSkips, ranges: collectRanges(0) }
            : undefined
    }
    const firstQueryChar: number = query.charCodeAt(0)
    for (let startWord = 0; startWord < words.length; startWord++) {
        if (words[startWord]?.charCodeAt(0) === firstQueryChar && matchFrom(startWord, 0)) {
            return { tier: MatchTier.WordPrefixChain, ranges: collectRanges(startWord) }
        }
    }
    return undefined
}

/**
 * Whether all characters of the query occur in the key in order — a necessary condition of every word-prefix
 * chain, far cheaper than the chain search itself.
 */
function isSubsequence(query: string, key: string): boolean {
    let keyOffset: number = 0
    for (let i = 0; i < query.length; i++) {
        keyOffset = key.indexOf(query.charAt(i), keyOffset)
        if (keyOffset < 0) {
            return false
        }
        keyOffset++
    }
    return true
}

function letterBit(charCode: number): number | undefined {
    if (charCode >= letterCodeA && charCode <= letterCodeZ) {
        return 1 << (charCode - letterCodeA)
    }
    return undefined
}

function isSeparator(char: string): boolean {
    return char === '-' || char === '_' || /\s/.test(char)
}
