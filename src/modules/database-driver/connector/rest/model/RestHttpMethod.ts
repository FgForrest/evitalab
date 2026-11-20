/**
 * HTTP methods used by evitaDB REST API operations.
 */
export enum RestHttpMethod {
    Get = 'GET',
    Post = 'POST',
    Put = 'PUT',
    Patch = 'PATCH',
    Delete = 'DELETE'
}

/**
 * Resolves a method from the lower-case key used in OpenAPI path items. Returns `undefined` for anything that is
 * not an operation (`parameters`, `summary`, …) or a method evitaDB does not use.
 */
export function restHttpMethodFromOpenApiKey(key: string): RestHttpMethod | undefined {
    const upperCased: string = key.toUpperCase()
    return Object.values(RestHttpMethod).find(method => method === upperCased)
}
