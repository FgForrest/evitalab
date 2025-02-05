import Immutable from 'immutable'

const stringWithCaseWordSplittingPattern: RegExp = /([^\s\-_A-Z]+)|([A-Z]+[^\s\-_A-Z]*)/g
const unsupportedCharactersForWordSplittingPattern: RegExp = /[.:+\-@/\\|`~]/g

/**
 * The number of bytes in a kibibyte.
 */
const oneKiB: number = 1024
/**
 * The number of bytes in a mebibyte.
 */
const oneMiB: number = oneKiB * oneKiB
/**
 * The number of bytes in a gigibyte.
 */
const oneGiB: number = oneKiB * oneMiB

const sizeFormatter: Intl.NumberFormat = new Intl.NumberFormat(
    navigator.language,
    { maximumFractionDigits: 2 }
)

/**
 * Splits string into words.
 * @param s input string to split
 */
export function splitStringWithCaseIntoWords(s?: string): Immutable.List<string> {
    if (s == undefined || s.trim().length === 0) {
        return Immutable.List()
    }

    // remove unsupported characters in concrete cases (not base case)
    const newString: string = s.replaceAll(unsupportedCharactersForWordSplittingPattern, ' ')

    const words: string[] = []
    const results: IterableIterator<RegExpMatchArray> = newString.matchAll(stringWithCaseWordSplittingPattern)
    for (const result of results) {
        words.push(result[0])
    }
    return Immutable.List(words)
}

export function formatByteSize(sizeInBytes: number): string {
    if (Math.floor(sizeInBytes / oneGiB) > 0) {
        return `${sizeFormatter.format(sizeInBytes / oneGiB)} GiB`
    } else if (Math.floor(sizeInBytes / oneMiB) > 0) {
        return `${sizeFormatter.format(sizeInBytes / oneMiB)} MiB`
    } else if (Math.floor(sizeInBytes / oneKiB) > 0) {
        return `${sizeFormatter.format(sizeInBytes / oneKiB)} KiB`
    } else {
        return `${sizeFormatter.format(sizeInBytes)} B`
    }
}

export function formatCount(count: number): string {
    if (Math.floor(count / 1_000_000_000) > 0) {
        return `${sizeFormatter.format(count / 1_000_000_000)}G`
    } else if (Math.floor(count / 100_000) > 0) {
        return `${sizeFormatter.format(count / 100_000)}M`
    } else if (Math.floor(count / 1_000) > 0) {
        return `${sizeFormatter.format(count / 1_000)}k`
    } else {
        return `${sizeFormatter.format(count)}`;
    }
}
