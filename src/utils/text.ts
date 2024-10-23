/**
 * Truncates the given text to the given max length and adds '...' at the end if too long.
 */
export function ellipsis(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
        return text
    }
    return text.substring(0, maxLength - 3) + '...'
}
