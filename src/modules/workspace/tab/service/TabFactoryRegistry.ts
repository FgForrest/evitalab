import type { InjectionKey } from 'vue'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import type { TabFactory } from '@/modules/workspace/tab/service/TabFactory'
import { InitializationError } from '@/modules/base/exception/InitializationError'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { mandatoryInject } from '@/utils/reactivity'

export const tabFactoryRegistryInjectionKey: InjectionKey<TabFactoryRegistry> = Symbol('tabFactoryRegistry')

const canonicalTabTypeIds: Set<string> = new Set(Object.values(TabType))

/**
 * Registry of {@link TabFactory}s contributed by feature modules during bootstrap. It is the only
 * way for the workspace to construct tabs of concrete feature modules, which keeps the workspace
 * independent of them.
 */
export class TabFactoryRegistry {

    private readonly factories: Map<string, TabFactory> = new Map()

    /**
     * Contributes a factory into this registry under its canonical tab type and all its legacy ids.
     */
    register(factory: TabFactory): void {
        this.index(factory.tabType, factory)
        for (const legacyTabTypeId of factory.legacyTabTypeIds ?? []) {
            if (canonicalTabTypeIds.has(legacyTabTypeId)) {
                throw new InitializationError(
                    `Legacy tab type id '${legacyTabTypeId}' of tab type '${factory.tabType}' collides with a canonical tab type.`
                )
            }
            this.index(legacyTabTypeId, factory)
        }
    }

    /**
     * Returns factory registered for the passed canonical or legacy tab type id.
     * @throws UnexpectedError if there is no such factory
     */
    getFactory(tabTypeId: string): TabFactory {
        const factory: TabFactory | undefined = this.findFactory(tabTypeId)
        if (factory == undefined) {
            throw new UnexpectedError(`Unsupported tab type '${tabTypeId}'.`)
        }
        return factory
    }

    /**
     * Returns factory registered for the passed canonical or legacy tab type id, or undefined if there
     * is no such factory.
     */
    findFactory(tabTypeId: string): TabFactory | undefined {
        return this.factories.get(tabTypeId)
    }

    /**
     * Verifies that every known tab type has a contributed factory. Called once after all modules are
     * registered to turn a forgotten contribution into an immediate startup failure.
     * @throws InitializationError if some tab type has no factory
     */
    validate(): void {
        const tabTypesWithoutFactory: string[] = Object.values(TabType)
            .filter(tabType => !this.factories.has(tabType))
        if (tabTypesWithoutFactory.length > 0) {
            throw new InitializationError(
                `No tab factory has been registered for tab types: ${tabTypesWithoutFactory.join(', ')}.`
            )
        }
    }

    private index(tabTypeId: string, factory: TabFactory): void {
        if (this.factories.has(tabTypeId)) {
            throw new InitializationError(`There is already registered tab factory for tab type '${tabTypeId}'.`)
        }
        this.factories.set(tabTypeId, factory)
    }
}

export const useTabFactoryRegistry = (): TabFactoryRegistry => {
    return mandatoryInject(tabFactoryRegistryInjectionKey) as TabFactoryRegistry
}
