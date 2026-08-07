import { errorMessage } from '@/utils/error'
import { DocumentFormattingError } from '@/modules/code-editor/exception/DocumentFormattingError'

/**
 * Reformats a JSON document into an indented multiline form.
 *
 * @param source JSON document to format
 * @throws DocumentFormattingError when the document is not valid JSON
 */
export function prettifyJson(source: string): string {
    return JSON.stringify(parseJson(source), undefined, 2)
}

/**
 * Reformats a JSON document into a single line without any redundant whitespace.
 *
 * @param source JSON document to format
 * @throws DocumentFormattingError when the document is not valid JSON
 */
export function minifyJson(source: string): string {
    return JSON.stringify(parseJson(source))
}

function parseJson(source: string): unknown {
    try {
        return JSON.parse(source)
    } catch (e) {
        throw new DocumentFormattingError(errorMessage(e))
    }
}
