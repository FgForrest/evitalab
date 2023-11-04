import { TabRequest } from '@/model/editor/editor'
import { EvitaDBConnection, EvitaDBConnectionId, UnexpectedError } from '@/model/lab'
import ky from 'ky'
import { EvitaQLConsoleRequest } from '@/model/editor/evitaql-console-request'
import { LabService } from '@/services/lab.service'
import { GraphQLConsoleRequest } from '@/model/editor/graphql-console-request'
import { GraphQLInstanceType } from '@/model/editor/graphql-console'
import { inject, InjectionKey } from 'vue'
import { DemoSnippetRequest } from '@/model/editor/demo-snippet-request'

const demoConnectionId: EvitaDBConnectionId = 'demo'
const demoCatalog: string = 'evita'
const baseCodeSnippetUrl: string = 'https://raw.githubusercontent.com/FgForrest/evitaDB'

export const key: InjectionKey<DemoSnippetResolver> = Symbol()

/**
 * Resolves demo code snippet requests from URL into {@link TabRequest}s.
 */
export class DemoSnippetResolver {
    private readonly labService: LabService

    constructor(labService: LabService) {
        this.labService = labService
    }

    /**
     * Resolves input request into tab request.
     */
    async resolve(request: DemoSnippetRequest | undefined): Promise<TabRequest<any, any> | undefined> {
        if (request == undefined) {
            return undefined
        }

        const codeSnippetUrl: string = `${baseCodeSnippetUrl}/${request.branch}/${request.path}`
        let codeSnippetContent: string
        try {
            codeSnippetContent = await ky.get(codeSnippetUrl).text()
        } catch (e) {
            throw new UnexpectedError(undefined, `Cannot fetch demo code snippet '${request.path}' from GitHub from branch '${request.branch}'.`)
        }

        const demoConnection: EvitaDBConnection | undefined = this.labService.getConnection(demoConnectionId)
        if (demoConnection == undefined) {
            throw new UnexpectedError(undefined, `Demo connection '${demoConnectionId}' not found.`)
        }

        const extension: string = request.path.substring(request.path.lastIndexOf(".") + 1)
        switch (extension) {
            case CodeSnippetType.EvitaQL:
                return new EvitaQLConsoleRequest(
                    demoConnection,
                    demoCatalog,
                    {
                        query: codeSnippetContent
                    },
                    true
                )
            case CodeSnippetType.GraphQL:
                return new GraphQLConsoleRequest(
                    demoConnection,
                    demoCatalog,
                    GraphQLInstanceType.DATA,
                    {
                        query: codeSnippetContent
                    },
                    true
                )
            default:
                throw new UnexpectedError(undefined, `Unsupported demo code snippet type: ${extension}`)
        }
    }
}

export const useDemoSnippetResolver = (): DemoSnippetResolver => {
    return inject(key) as DemoSnippetResolver
}

/**
 * Supported demo code snippet types.
 */
enum CodeSnippetType {
    EvitaQL = "evitaql",
    GraphQL = "graphql",
}
