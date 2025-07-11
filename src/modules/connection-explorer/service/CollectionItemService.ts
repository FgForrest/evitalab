import { ClassifierValidationErrorType } from '@/modules/database-driver/data-type/ClassifierValidationErrorType'
import { ClassifierType } from '@/modules/database-driver/data-type/ClassifierType'
import type { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'

export const collectionItemServiceInjectionKey: InjectionKey<CollectionItemService> = Symbol('collectionItemService')

/**
 * Handles custom operation of CollectionItem tree item
 */
export class CollectionItemService {
    private readonly evitaClient: EvitaClient

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
    }

    async createCollection(catalogName: string, entityType: string): Promise<void> {
        await this.evitaClient.updateCatalog(catalogName, async session => {
            return await session.createCollection(entityType)
        })
        await this.evitaClient.clearCache()
    }

    async deleteCollection(catalogName: string, entityType: string): Promise<boolean> {
        const deleted: boolean = await this.evitaClient.updateCatalog(catalogName, async session => {
            return await session.deleteCollection(entityType)
        })
        if (deleted) {
            await this.evitaClient.clearCache()
        }
        return deleted
    }

    async renameCollection(
        catalogName: string,
        entityType: string,
        newName: string,
    ): Promise<boolean> {
        const renamed: boolean = await this.evitaClient.updateCatalog(catalogName, async session => {
            return await session.renameCollection(entityType, newName)
        })
        if (renamed) {
            await this.evitaClient.clearCache()
        }
        return renamed
    }

    async isEntityTypeValid(entityType: string): Promise<ClassifierValidationErrorType | undefined> {
        return await this.evitaClient.management.isClassifierValid(ClassifierType.Entity, entityType)
    }

    async isEntityTypeAvailable(catalogName: string, entityType: string): Promise<boolean> {
        return await this.evitaClient.queryCatalog(catalogName, async session => {
            return !(await session.getAllEntityTypes()).contains(entityType)
        })
    }
}

export function useCollectionItemService(): CollectionItemService {
    return mandatoryInject(collectionItemServiceInjectionKey) as CollectionItemService
}
