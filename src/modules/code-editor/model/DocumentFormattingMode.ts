/**
 * Direction in which a document is reformatted.
 */
export enum DocumentFormattingMode {
    /**
     * Expands the document into an indented, readable multiline form.
     */
    Prettify = 'prettify',
    /**
     * Collapses the document into a single line without any redundant whitespace.
     */
    Minify = 'minify'
}
