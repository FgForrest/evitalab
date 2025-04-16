import { InjectionKey } from 'vue'
import { ShareTabObject } from '@/modules/workspace/tab/model/ShareTabObject'
import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { EntityViewerTabFactory } from '@/modules/entity-viewer/viewer/workspace/service/EntityViewerTabFactory'
import { EvitaQLConsoleTabFactory } from '@/modules/evitaql-console/console/workspace/service/EvitaQLConsoleTabFactory'
import { GraphQLConsoleTabFactory } from '@/modules/graphql-console/console/workspace/service/GraphQLConsoleTabFactory'
import { SchemaViewerTabFactory } from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { mandatoryInject } from '@/utils/reactivity'
import { TrafficRecordHistoryViewerTabFactory } from '@/modules/traffic-viewer/service/TrafficRecordHistoryViewerTabFactory'
import { ConnectionId } from '@/modules/connection/model/ConnectionId'
import {
    isTabParamsDtoWithConnection,
    TabParamsDtoWithConnection
} from '@/modules/workspace/tab/model/TabParamsDtoWithConnection'
import { InvalidConnectionInSharedTabError } from '@/modules/workspace/tab/error/InvalidConnectionInSharedTabError'
import { ConnectionNotFoundError } from '@/modules/connection/error/ConnectionNotFoundError'

export const sharedTabResolverInjectionKey: InjectionKey<SharedTabResolver> = Symbol('sharedTabResolver')

/**
 * Resolves shared tab requests from URL into {@link TabDefinition}s.
 */
export class SharedTabResolver {
    private readonly entityViewerTabFactory: EntityViewerTabFactory
    private readonly evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory
    private readonly graphQLConsoleTabFactory: GraphQLConsoleTabFactory
    private readonly schemaViewerTabFactory: SchemaViewerTabFactory
    private readonly trafficRecordHistoryViewerTabFactory: TrafficRecordHistoryViewerTabFactory

    constructor(entityViewerTabFactory: EntityViewerTabFactory,
                evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory,
                graphQLConsoleTabFactory: GraphQLConsoleTabFactory,
                schemaViewerTabFactory: SchemaViewerTabFactory,
                trafficRecordHistoryViewerTabFactory: TrafficRecordHistoryViewerTabFactory) {
        this.entityViewerTabFactory = entityViewerTabFactory
        this.evitaQLConsoleTabFactory = evitaQLConsoleTabFactory
        this.graphQLConsoleTabFactory = graphQLConsoleTabFactory
        this.schemaViewerTabFactory = schemaViewerTabFactory
        this.trafficRecordHistoryViewerTabFactory = trafficRecordHistoryViewerTabFactory
    }

    async resolve(shareTabObject: ShareTabObject): Promise<TabDefinition<any, any>> {
        try {
            switch (shareTabObject.tabType as string) {
                case 'data-grid':
                case 'dataGrid':
                case TabType.EntityViewer:
                    return this.entityViewerTabFactory.restoreFromJson(shareTabObject.tabParams, shareTabObject.tabData)
                case 'evitaql-console':
                case TabType.EvitaQLConsole:
                    return this.evitaQLConsoleTabFactory.restoreFromJson(shareTabObject.tabParams, shareTabObject.tabData)
                case 'graphql-console':
                case TabType.GraphQLConsole:
                    return this.graphQLConsoleTabFactory.restoreFromJson(shareTabObject.tabParams, shareTabObject.tabData)
                case 'schema-viewer':
                case TabType.SchemaViewer:
                    return this.schemaViewerTabFactory.restoreFromJson(shareTabObject.tabParams)
                case TabType.TrafficRecordHistoryViewer:
                    return this.trafficRecordHistoryViewerTabFactory.restoreFromJson(shareTabObject.tabParams, shareTabObject.tabData)
                default:
                    throw new UnexpectedError(`Unsupported shared tab type '${shareTabObject.tabType}'.`)
            }
        } catch (e) {
            if (e instanceof ConnectionNotFoundError && isTabParamsDtoWithConnection(shareTabObject.tabParams)) {
                const tabParams: any = shareTabObject.tabParams as TabParamsDtoWithConnection
                const connectionName: string | undefined = tabParams.connectionName

                throw new InvalidConnectionInSharedTabError(
                    connectionName,
                    async (newConnectionId: ConnectionId): Promise<TabDefinition<any, any>> => {
                        const newTabParams: TabParamsDtoWithConnection = JSON.parse(JSON.stringify(tabParams))
                        newTabParams.connectionId = newConnectionId

                        return await this.resolve(new ShareTabObject(
                            shareTabObject.tabType,
                            newTabParams,
                            shareTabObject.tabData
                        ))
                    }
                )
            } else {
                throw e
            }
        }
    }
}

export const useSharedTabResolver = (): SharedTabResolver => {
    return mandatoryInject(sharedTabResolverInjectionKey) as SharedTabResolver
}
