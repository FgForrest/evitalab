import type { InjectionKey } from 'vue'
import { ShareTabObject } from '@/modules/workspace/tab/model/ShareTabObject'
import type { AnyTabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { TabFactoryRegistry } from '@/modules/workspace/tab/service/TabFactoryRegistry'
import type { TabFactory } from '@/modules/workspace/tab/service/TabFactory'
import { mandatoryInject } from '@/utils/reactivity'
import type { ConnectionId } from '@/modules/connection/model/ConnectionId'
import { isTabParamsDtoWithConnection } from '@/modules/workspace/tab/model/TabParamsDtoWithConnection'
import type { TabParamsDtoWithConnection } from '@/modules/workspace/tab/model/TabParamsDtoWithConnection'
import { InvalidConnectionInSharedTabError } from '@/modules/workspace/tab/error/InvalidConnectionInSharedTabError'
import { ConnectionNotFoundError } from '@/modules/connection/exception/ConnectionNotFoundError'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'

export const sharedTabResolverInjectionKey: InjectionKey<SharedTabResolver> = Symbol('sharedTabResolver')

/**
 * Resolves shared tab requests from URL into {@link TabDefinition}s.
 */
export class SharedTabResolver {
    private readonly tabFactoryRegistry: TabFactoryRegistry

    constructor(tabFactoryRegistry: TabFactoryRegistry) {
        this.tabFactoryRegistry = tabFactoryRegistry
    }

    async resolve(shareTabObject: ShareTabObject): Promise<AnyTabDefinition> {
        try {
            const tabTypeId: string = shareTabObject.tabType as string
            const factory: TabFactory | undefined = this.tabFactoryRegistry.findFactory(tabTypeId)
            if (factory == undefined || !factory.restorable) {
                throw new UnexpectedError(`Unsupported shared tab type '${tabTypeId}'.`)
            }
            return factory.restoreFromJson(shareTabObject.tabParams, shareTabObject.tabData)
        } catch (e) {
            if (e instanceof ConnectionNotFoundError && isTabParamsDtoWithConnection(shareTabObject.tabParams)) {
                const tabParams: TabParamsDtoWithConnection = shareTabObject.tabParams as TabParamsDtoWithConnection
                const connectionName: string | undefined = tabParams.connectionName

                throw new InvalidConnectionInSharedTabError(
                    connectionName,
                    async (newConnectionId: ConnectionId): Promise<AnyTabDefinition> => {
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
