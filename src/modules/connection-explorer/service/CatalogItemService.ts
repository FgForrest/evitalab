import type { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { ClassifierValidationErrorType } from '@/modules/database-driver/data-type/ClassifierValidationErrorType'
import { ClassifierType } from '@/modules/database-driver/data-type/ClassifierType'
import { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { List as ImmutableList } from 'immutable'

export const catalogItemServiceInjectionKey: InjectionKey<CatalogItemService> = Symbol('catalogItemService')

/**
 * Handles custom actions for the CatalogItem tree item
 */
export class CatalogItemService {
    private readonly evitaClient: EvitaClient

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
    }

    async getCatalogs(): Promise<ImmutableList<CatalogStatistics>> {
        return await this.evitaClient.management.getCatalogStatistics()
    }

    async createCatalog(catalogName: string): Promise<boolean> {
        const created: boolean = await this.evitaClient.createCatalog(catalogName)
        if (created) {
            await this.evitaClient.clearCache()
        }
        return created
    }

    async deleteCatalog(catalog: string): Promise<boolean> {
        const deleted: boolean = await this.evitaClient.deleteCatalogIfExists(catalog)
        if (deleted) {
            await this.evitaClient.clearCache()
        }
        return deleted
    }

    async renameCatalog(
        catalogName: string,
        newCatalogName: string
    ): Promise<boolean> {
        const renamed: boolean = await this.evitaClient.renameCatalog(catalogName, newCatalogName)
        if (renamed) {
            await this.evitaClient.clearCache()
        }
        return renamed
    }

    async replaceCatalog(
        catalogNameToBeReplacedWith: string,
        catalogNameToBeReplaced: string
    ): Promise<boolean> {
        const replaced: boolean = await this.evitaClient.replaceCatalog(
            catalogNameToBeReplacedWith,
            catalogNameToBeReplaced
        )
        if (replaced) {
            await this.evitaClient.clearCache()
        }
        return replaced
    }

    async switchCatalogToAliveState(catalogName: string): Promise<boolean> {
        const switched: boolean = await this.evitaClient.queryCatalog(catalogName, async session => {
            return await session.goLiveAndClose()
        })
        if (switched) {
            await this.evitaClient.clearCache()
        }
        return switched
    }

    async isCatalogNameValid(catalogName: string): Promise<ClassifierValidationErrorType | undefined> {
        return await this.evitaClient.management.isClassifierValid(ClassifierType.Catalog, catalogName)
    }

    async isCatalogNameAvailable(catalogName: string): Promise<boolean> {
        return !(await this.isCatalogExists(catalogName))
    }

    async isCatalogExists(catalogName: string): Promise<boolean> {
        return (await this.evitaClient.getCatalogNames()).contains(catalogName)
    }

    async closeSharedSession(catalogName: string): Promise<void> {
        await this.evitaClient.closeSharedSession(catalogName)
    }
}

export function useCatalogItemService(): CatalogItemService {
    return mandatoryInject(catalogItemServiceInjectionKey) as CatalogItemService
}
