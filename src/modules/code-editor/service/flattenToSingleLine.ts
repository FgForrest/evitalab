const lineBreakPattern: RegExp = /\r\n|\r|\n/

/**
 * Collapses multiline text into a single line: each line is trimmed, blank lines are dropped, and the
 * remainder is joined with a single space. Whitespace-insensitive query languages (evitaQL, GraphQL
 * constraint syntax) keep their meaning, so a pretty-printed query pasted into an inline editor stays
 * valid.
 *
 * Text without any line break is returned as-is, so deliberate leading/trailing whitespace survives.
 *
 * @param text text to flatten, may contain any combination of `\n`, `\r\n` and `\r` line endings
 */
export function flattenToSingleLine(text: string): string {
    if (!lineBreakPattern.test(text)) {
        return text
    }
    return text
        .split(lineBreakPattern)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join(' ')
}
