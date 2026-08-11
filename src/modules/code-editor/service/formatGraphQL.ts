import { parse, print, stripIgnoredCharacters } from 'graphql'
import { errorMessage } from '@/utils/error'
import { DocumentFormattingError } from '@/modules/code-editor/exception/DocumentFormattingError'

/**
 * Reformats a GraphQL document into the canonical indented form of the reference GraphQL printer.
 *
 * The printer works on the parsed document, which carries no comments, so `#` comments are lost and an
 * explicitly named `query { … }` operation is rewritten into the shorthand `{ … }` form.
 *
 * @param source GraphQL document to format
 * @throws DocumentFormattingError when the document cannot be parsed
 */
export function prettifyGraphQL(source: string): string {
    try {
        return print(parse(source))
    } catch (e) {
        throw new DocumentFormattingError(errorMessage(e))
    }
}

/**
 * Strips all insignificant characters (whitespace, commas, comments) from a GraphQL document.
 *
 * @param source GraphQL document to format
 * @throws DocumentFormattingError when the document cannot be tokenized or carries no operation at all
 */
export function minifyGraphQL(source: string): string {
    let minified: string
    try {
        minified = stripIgnoredCharacters(source)
    } catch (e) {
        throw new DocumentFormattingError(errorMessage(e))
    }
    if (minified.length === 0) {
        // a comment-only or blank document strips down to nothing; formatting it would wipe the editor
        throw new DocumentFormattingError('the document contains no GraphQL operation')
    }
    return minified
}
