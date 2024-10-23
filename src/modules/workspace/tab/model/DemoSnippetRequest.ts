/**
 * Requests opening new tab with contents of a code snippet from evitaDB demo.
 */
export type DemoSnippetRequest = {
    readonly branch: string,
    readonly path: string
}
