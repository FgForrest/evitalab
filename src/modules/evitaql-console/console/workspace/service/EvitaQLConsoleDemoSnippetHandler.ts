import type { DemoSnippetHandler } from '@/modules/workspace/service/DemoSnippetHandler'
import {
    EvitaQLConsoleTabDefinition
} from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabDefinition'
import { EvitaQLConsoleTabData } from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabData'
import {
    EvitaQLConsoleTabFactory
} from '@/modules/evitaql-console/console/workspace/service/EvitaQLConsoleTabFactory'

/**
 * Opens evitaQL demo code snippets in the evitaQL console.
 */
export class EvitaQLConsoleDemoSnippetHandler implements DemoSnippetHandler {

    readonly codeSnippetType: string = 'evitaql'

    private readonly evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory

    constructor(evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory) {
        this.evitaQLConsoleTabFactory = evitaQLConsoleTabFactory
    }

    createTab(catalogName: string, snippetContent: string): EvitaQLConsoleTabDefinition {
        return this.evitaQLConsoleTabFactory.createNew(
            catalogName,
            new EvitaQLConsoleTabData(snippetContent),
            true
        )
    }
}
