import ky from 'ky'
import { InjectionKey } from 'vue'
import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { ConnectionId } from '@/modules/connection/model/ConnectionId'
import { DemoSnippetRequest } from '@/modules/workspace/tab/model/DemoSnippetRequest'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { Connection } from '@/modules/connection/model/Connection'
import { GraphQLInstanceType } from '@/modules/graphql-console/console/model/GraphQLInstanceType'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { GraphQLConsoleTabFactory } from '@/modules/graphql-console/console/workspace/service/GraphQLConsoleTabFactory'
import { EvitaQLConsoleTabFactory } from '@/modules/evitaql-console/console/workspace/service/EvitaQLConsoleTabFactory'
import { EvitaQLConsoleTabData } from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabData'
import { GraphQLConsoleTabData } from '@/modules/graphql-console/console/workspace/model/GraphQLConsoleTabData'
import { mandatoryInject } from '@/utils/reactivity'

const demoConnectionId: ConnectionId = 'demo'
const demoCatalog: string = 'evita'
const baseCodeSnippetUrl: string = 'https://raw.githubusercontent.com/FgForrest/evitaDB'

export const demoSnippetResolverInjectionKey: InjectionKey<DemoSnippetResolver> = Symbol('demoSnippetResolver')

/**
 * Resolves demo code snippet requests from URL into {@link TabRequest}s.
 */
export class DemoSnippetResolver {
    private readonly connectionService: ConnectionService
    private readonly evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory
    private readonly graphQLConsoleTabFactory: GraphQLConsoleTabFactory

    constructor(connectionService: ConnectionService,
                evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory,
                graphQLConsoleTabFactory: GraphQLConsoleTabFactory) {
        this.connectionService = connectionService
        this.evitaQLConsoleTabFactory = evitaQLConsoleTabFactory
        this.graphQLConsoleTabFactory = graphQLConsoleTabFactory
    }

    /**
     * Resolves input request into tab request.
     */
    async resolve(requestSerialized: string): Promise<TabDefinition<any, any>> {
        const request: DemoSnippetRequest = JSON.parse(atob(requestSerialized)) as DemoSnippetRequest

        const codeSnippetUrl: string = `${baseCodeSnippetUrl}/${request.branch}/${request.path}`
        let codeSnippetContent: string
        try {
            codeSnippetContent = await ky.get(codeSnippetUrl).text()
        } catch (e) {
            throw new UnexpectedError(`Cannot fetch demo code snippet '${request.path}' from GitHub from branch '${request.branch}'.`)
        }

        const demoConnection: Connection = this.connectionService.getConnection(demoConnectionId)

        const extension: string = request.path.substring(request.path.lastIndexOf(".") + 1)
        switch (extension) {
            case CodeSnippetType.EvitaQL:
                return this.evitaQLConsoleTabFactory.createNew(
                    demoConnection,
                    demoCatalog,
                    new EvitaQLConsoleTabData(codeSnippetContent),
                    true
                )
            case CodeSnippetType.GraphQL:
                return this.graphQLConsoleTabFactory.createNew(
                    demoConnection,
                    demoCatalog,
                    GraphQLInstanceType.Data,
                    new GraphQLConsoleTabData(codeSnippetContent),
                    true
                )
            default:
                throw new UnexpectedError(`Unsupported demo code snippet type: ${extension}`)
        }
    }
}

export const useDemoSnippetResolver = (): DemoSnippetResolver => {
    return mandatoryInject(demoSnippetResolverInjectionKey) as DemoSnippetResolver
}

/**
 * Supported demo code snippet types.
 */
enum CodeSnippetType {
    EvitaQL = "evitaql",
    GraphQL = "graphql",
}
