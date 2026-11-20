/**
 * Parsed OpenAPI document as a plain JSON object. It is walked dynamically by its consumers, which validate every
 * part they read.
 */
export type RestOpenApiDocument = Readonly<Record<string, unknown>>

/**
 * OpenAPI specification of one evitaDB REST API instance.
 *
 * Holds the document parsed exactly once, together with the hash of the text it was parsed from, so a refresh can
 * tell cheaply whether the specification changed. The raw text itself is not kept in memory — the catalog
 * specification is several megabytes large and is only needed by the persistent cache, which receives it at the
 * fetch point.
 */
export class RestOpenApi {
    readonly specHash: string
    readonly document: RestOpenApiDocument

    constructor(specHash: string, document: RestOpenApiDocument) {
        this.specHash = specHash
        this.document = document
    }
}
