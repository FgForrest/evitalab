import type { Extension } from '@codemirror/state'
import type { OasContext } from '@ruzito/oas-ls-backend'
import type { RestOpenApi } from '@/modules/database-driver/connector/rest/model/RestOpenApi'
import type { RestHttpMethod } from '@/modules/database-driver/connector/rest/model/RestHttpMethod'

/**
 * What the body editor's language support needs to know about the request the body belongs to.
 */
export interface RestBodyRequestMeta {
    readonly method: RestHttpMethod
    /**
     * Templated path of the selected operation variant, as declared by the specification.
     */
    readonly pathTemplate: string
}

/**
 * Builds the language-server context of a specification. The already parsed document is used directly — the
 * package's own `parseOas` would parse the several megabytes large text a second time.
 */
export function createOasContext(openApi: RestOpenApi): OasContext {
    return { root: openApi.document, externalRefs: {} }
}

/**
 * Creates the CodeMirror extension providing OpenAPI-aware completion and lint for a JSON request body, including
 * the JSON language support itself.
 *
 * The language-server packages are loaded lazily, because they bundle several WebAssembly binaries that only the
 * REST console needs.
 */
export async function loadRestBodyLanguageSupport(
    context: OasContext,
    metaProvider: () => RestBodyRequestMeta
): Promise<Extension> {
    const { json } = await import('@ruzito/oas-ls-codemirror')
    return json(context, async () => {
        const meta: RestBodyRequestMeta = metaProvider()
        return {
            method: meta.method,
            path: meta.pathTemplate,
            headers: [{ key: 'Content-Type', value: 'application/json' }]
        }
    })
}
