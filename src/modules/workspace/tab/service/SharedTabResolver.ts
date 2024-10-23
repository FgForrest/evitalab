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
import { ServerViewerTabFactory } from '@/modules/server-viewer/service/ServerViewerTabFactory'
import { TaskViewerTabFactory } from '@/modules/task-viewer/services/TaskViewerTabFactory'

export const sharedTabResolverInjectionKey: InjectionKey<SharedTabResolver> = Symbol('sharedTabResolver')

/**
 * Resolves shared tab requests from URL into {@link TabDefinition}s.
 */
export class SharedTabResolver {
    private readonly entityViewerTabFactory: EntityViewerTabFactory
    private readonly evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory
    private readonly graphQLConsoleTabFactory: GraphQLConsoleTabFactory
    private readonly schemaViewerTabFactory: SchemaViewerTabFactory

    constructor(entityViewerTabFactory: EntityViewerTabFactory,
                evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory,
                graphQLConsoleTabFactory: GraphQLConsoleTabFactory,
                schemaViewerTabFactory: SchemaViewerTabFactory) {
        this.entityViewerTabFactory = entityViewerTabFactory
        this.evitaQLConsoleTabFactory = evitaQLConsoleTabFactory
        this.graphQLConsoleTabFactory = graphQLConsoleTabFactory
        this.schemaViewerTabFactory = schemaViewerTabFactory
    }

    async resolve(shareTabObjectSerialized: string | undefined): Promise<TabDefinition<any, any> | undefined> {
        if (shareTabObjectSerialized == undefined) {
            return undefined
        }
        const shareTabObject: ShareTabObject = ShareTabObject.fromLinkParam(shareTabObjectSerialized)

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
            default:
                throw new UnexpectedError(`Unsupported shared tab type '${shareTabObject.tabType}'.`)
        }
    }
}

export const useSharedTabResolver = (): SharedTabResolver => {
    return mandatoryInject(sharedTabResolverInjectionKey) as SharedTabResolver
}
