import ky from 'ky'
import type { InjectionKey } from 'vue'
import type { AnyTabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import type { DemoSnippetRequest } from '@/modules/workspace/tab/model/DemoSnippetRequest'
import type { DemoSnippetHandler } from '@/modules/workspace/service/DemoSnippetHandler'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { InitializationError } from '@/modules/base/exception/InitializationError'
import { mandatoryInject } from '@/utils/reactivity'
import { decodeBase64ToUtf8 } from '@/utils/base64'

const demoCatalog: string = 'evita'
const baseCodeSnippetUrl: string = 'https://raw.githubusercontent.com/FgForrest/evitaDB'

export const demoSnippetResolverInjectionKey: InjectionKey<DemoSnippetResolver> = Symbol('demoSnippetResolver')

/**
 * Resolves demo code snippet requests from URL into {@link TabRequest}s.
 */
export class DemoSnippetResolver {
    private readonly handlers: Map<string, DemoSnippetHandler> = new Map()

    /**
     * Contributes a handler able to open demo code snippets of a single language.
     */
    registerHandler(handler: DemoSnippetHandler): void {
        if (this.handlers.has(handler.codeSnippetType)) {
            throw new InitializationError(
                `There is already registered demo snippet handler for type '${handler.codeSnippetType}'.`
            )
        }
        this.handlers.set(handler.codeSnippetType, handler)
    }

    /**
     * Resolves input request into tab request.
     */
    async resolve(requestSerialized: string): Promise<AnyTabDefinition> {
        const request: DemoSnippetRequest = JSON.parse(decodeBase64ToUtf8(requestSerialized)) as DemoSnippetRequest

        const codeSnippetUrl: string = `${baseCodeSnippetUrl}/${request.branch}/${request.path}`
        let codeSnippetContent: string
        try {
            codeSnippetContent = await ky.get(codeSnippetUrl).text()
        } catch {
            throw new UnexpectedError(`Cannot fetch demo code snippet '${request.path}' from GitHub from branch '${request.branch}'.`)
        }

        const extension: string = request.path.substring(request.path.lastIndexOf(".") + 1)
        const handler: DemoSnippetHandler | undefined = this.handlers.get(extension)
        if (handler == undefined) {
            throw new UnexpectedError(`Unsupported demo code snippet type: ${extension}`)
        }
        return handler.createTab(demoCatalog, codeSnippetContent)
    }
}

export const useDemoSnippetResolver = (): DemoSnippetResolver => {
    return mandatoryInject(demoSnippetResolverInjectionKey) as DemoSnippetResolver
}
