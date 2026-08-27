import type { AnyTabDefinition } from '@/modules/workspace/tab/model/TabDefinition'

/**
 * Contract a feature module must fulfil to open demo code snippets of a certain language in its own
 * tab. Handlers are contributed into the {@link DemoSnippetResolver} during bootstrap.
 */
export interface DemoSnippetHandler {

    /**
     * File extension of demo code snippets this handler can open.
     */
    readonly codeSnippetType: string

    /**
     * Creates a new tab presenting the passed demo code snippet.
     */
    createTab(catalogName: string, snippetContent: string): AnyTabDefinition
}
