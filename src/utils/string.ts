import Immutable from 'immutable'

const stringWithCaseWordSplittingPattern: RegExp = /([^\s\-_A-Z]+)|([A-Z]+[^\s\-_A-Z]*)/g
const unsupportedCharactersForWordSplittingPattern: RegExp = /[.:+\-@/\\|`~]/g

/**
 * The number of bytes in a kilobyte.
 */
const oneKB: number = 1024
/**
 * The number of bytes in a megabyte.
 */
const oneMB: number = oneKB * oneKB
/**
 * The number of bytes in a gigabyte.
 */
const oneGB: number = oneKB * oneMB

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
    if (Math.floor(sizeInBytes / oneGB) > 0) {
        return `${sizeFormatter.format(sizeInBytes / oneGB)} GB`
    } else if (Math.floor(sizeInBytes / oneMB) > 0) {
        return `${sizeFormatter.format(sizeInBytes / oneMB)} MB`
    } else if (Math.floor(sizeInBytes / oneKB) > 0) {
        return `${sizeFormatter.format(sizeInBytes / oneKB)} KB`
    } else {
        return `${sizeFormatter.format(sizeInBytes)} B`
    }
}
