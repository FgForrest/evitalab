import { test, expect, describe, vi } from 'vitest'

const getText = vi.fn()
vi.mock('ky', () => ({ default: { get: () => ({ text: getText }) } }))

import { DemoSnippetResolver } from '@/modules/workspace/service/DemoSnippetResolver'
import type { DemoSnippetHandler } from '@/modules/workspace/service/DemoSnippetHandler'
import type { AnyTabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { InitializationError } from '@/modules/base/exception/InitializationError'

function createRequest(path: string): string {
    return Buffer.from(JSON.stringify({ branch: 'dev', path }), 'utf-8').toString('base64')
}

function createHandler(codeSnippetType: string,
                       createTab: DemoSnippetHandler['createTab']): DemoSnippetHandler {
    return { codeSnippetType, createTab }
}

describe('DemoSnippetResolver', () => {
    test('opens a snippet with the handler contributed for its extension', async () => {
        getText.mockResolvedValue('query {}')
        const graphQLTab: AnyTabDefinition = {} as AnyTabDefinition
        const createGraphQLTab = vi.fn().mockReturnValue(graphQLTab)
        const resolver: DemoSnippetResolver = new DemoSnippetResolver()
        resolver.registerHandler(createHandler('evitaql', vi.fn()))
        resolver.registerHandler(createHandler('graphql', createGraphQLTab))

        expect(await resolver.resolve(createRequest('documentation/snippet.graphql'))).toBe(graphQLTab)
        expect(createGraphQLTab).toHaveBeenCalledWith('evita', 'query {}')
    })

    test('rejects a snippet no module contributed a handler for', async () => {
        getText.mockResolvedValue('SELECT 1')
        const resolver: DemoSnippetResolver = new DemoSnippetResolver()
        resolver.registerHandler(createHandler('evitaql', vi.fn()))

        await expect(resolver.resolve(createRequest('documentation/snippet.sql')))
            .rejects.toThrow(/Unsupported demo code snippet type: sql/)
    })

    test('rejects a second handler for the same extension', () => {
        const resolver: DemoSnippetResolver = new DemoSnippetResolver()
        resolver.registerHandler(createHandler('evitaql', vi.fn()))

        expect(() => resolver.registerHandler(createHandler('evitaql', vi.fn())))
            .toThrow(InitializationError)
    })
})
