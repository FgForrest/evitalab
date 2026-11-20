/**
 * Path of a `query*` operation: `/Product/query` or `/{locale}/Product/query`.
 */
const queryPathPattern: RegExp = /^(?:\/\{locale\})?\/([A-Z][^/]*)\/query$/

/**
 * Returns the entity collection (in the PascalCase variant REST paths use) whose `query` operation the path template
 * belongs to, or `undefined` for any other operation — only entity queries return visualisable extra results.
 */
export function resolveRestQueryCollection(pathTemplate: string): string | undefined {
    return queryPathPattern.exec(pathTemplate)?.[1]
}
