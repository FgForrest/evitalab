import { TabRequest } from '@/model/editor/editor'
import { EvitaDBConnection, EvitaDBConnectionId, UnexpectedError } from '@/model/lab'
import ky from 'ky'
import { EvitaQLConsoleRequest } from '@/model/editor/evitaql-console-request'
import { LabService } from '@/services/lab.service'
import { GraphQLConsoleRequest } from '@/model/editor/graphql-console-request'
import { GraphQLConsoleData, GraphQLInstanceType } from '@/model/editor/graphql-console'
import { inject, InjectionKey } from 'vue'
import { DemoSnippetRequest } from '@/model/editor/demo-snippet-request'
import { EvitaQLConsoleData } from '@/model/editor/evitaql-console'

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
    async resolve(requestSerialized: string | undefined): Promise<TabRequest<any, any> | undefined> {
        if (requestSerialized == undefined) {
            return undefined
        }
        const request: DemoSnippetRequest = JSON.parse(atob(requestSerialized)) as DemoSnippetRequest

        const codeSnippetUrl: string = `${baseCodeSnippetUrl}/${request.branch}/${request.path}`
        let codeSnippetContent: string
        try {
            codeSnippetContent = await ky.get(codeSnippetUrl).text()
        } catch (e) {
            throw new UnexpectedError(undefined, `Cannot fetch demo code snippet '${request.path}' from GitHub from branch '${request.branch}'.`)
        }

        const demoConnection: EvitaDBConnection = this.labService.getConnection(demoConnectionId)

        const extension: string = request.path.substring(request.path.lastIndexOf(".") + 1)
        switch (extension) {
            case CodeSnippetType.EvitaQL:
                return EvitaQLConsoleRequest.createNew(
                    demoConnection,
                    demoCatalog,
                    new EvitaQLConsoleData(codeSnippetContent),
                    true
                )
            case CodeSnippetType.GraphQL:
                return GraphQLConsoleRequest.createNew(
                    demoConnection,
                    demoCatalog,
                    GraphQLInstanceType.Data,
                    new GraphQLConsoleData(codeSnippetContent),
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
