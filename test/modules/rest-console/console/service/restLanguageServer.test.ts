import { describe, expect, test } from 'vitest'
import { requestCompletions, type Completion, type OasContext } from '@ruzito/oas-ls-backend'

/**
 * Smoke test of the language-server package the body editor is built on: it has to load under Vitest (Node, its
 * `node` export condition) and complete object keys of a request body from a specification it is handed as an
 * already parsed document — the console never lets the package parse or fetch the specification itself.
 */

const specification: OasContext['root'] = {
    openapi: '3.0.1',
    info: { title: 'test', version: '1' },
    paths: {
        '/{locale}/Product/query': {
            post: {
                operationId: 'queryProductLocalized',
                parameters: [{ name: 'locale', in: 'path', required: true, schema: { type: 'string' } }],
                requestBody: {
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/QueryBody' } } }
                },
                responses: { '200': { description: 'OK' } }
            }
        }
    },
    components: {
        schemas: {
            QueryBody: {
                type: 'object',
                properties: {
                    filterBy: { type: 'object' },
                    require: { type: 'object' }
                }
            }
        }
    }
}

describe('REST body language server', () => {
    test('Should complete the keys of a request body from an already parsed specification', async () => {
        const context: OasContext = { root: specification, externalRefs: {} }
        // the same synthetic request head the CodeMirror integration prepends to the body
        const head: string = 'POST /{locale}/Product/query HTTP/1.1\nContent-Type: application/json\n\n---\n\n'
        // the editor auto-closes the quote, the caret sits right after the typed prefix
        const body: string = '{ "fil" }'
        const caret: number = head.length + body.indexOf('fil') + 'fil'.length
        const completions: Completion[] = await requestCompletions(head + body, caret, context)
        expect(completions.map(it => it.name)).toContain('filterBy')
    })
})
