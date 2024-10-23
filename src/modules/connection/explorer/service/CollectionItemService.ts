import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { Connection } from '@/modules/connection/model/Connection'
import { Catalog } from '@/modules/connection/model/Catalog'
import { ClassifierValidationErrorType } from '@/modules/connection/model/data-type/ClassifierValidationErrorType'
import { EvitaDBDriver } from '@/modules/connection/driver/EvitaDBDriver'
import { ClassifierType } from '@/modules/connection/model/data-type/ClassifierType'
import { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'

export const collectionItemServiceInjectionKey: InjectionKey<CollectionItemService> = Symbol('collectionItemService')

/**
 * Handles custom operation of CollectionItem tree item
 */
export class CollectionItemService {
    private readonly connectionService: ConnectionService

    constructor(connectionService: ConnectionService) {
        this.connectionService = connectionService
    }

    async createCollection(
        connection: Connection,
        catalogName: string,
        entityType: string
    ): Promise<void> {
        const driver = await this.connectionService.getDriver(connection)
        return await driver.createCollection(
            connection,
            catalogName,
            entityType
        )
    }

    async dropCollection(connection: Connection, catalogName: string, entityType: string): Promise<boolean> {
        const driver = await this.connectionService.getDriver(connection)
        return await driver.dropCollection(connection, catalogName, entityType)
    }

    async renameCollection(
        connection: Connection,
        catalogName: string,
        entityType: string,
        newName: string,
    ): Promise<boolean> {
        const driver = await this.connectionService.getDriver(connection)
        return await driver.renameCollection(
            connection,
            catalogName,
            entityType,
            newName
        )
    }

    async isEntityTypeValid(connection: Connection, entityType: string): Promise<ClassifierValidationErrorType | undefined> {
        const driver: EvitaDBDriver = await this.connectionService.getDriver(connection)
        return driver.isClassifierValid(connection, ClassifierType.Entity, entityType)
    }

    async isEntityTypeAvailable(connection: Connection, catalogName: string, entityType: string): Promise<boolean> {
        const driver: EvitaDBDriver = await this.connectionService.getDriver(connection)
        const catalog: Catalog = await driver.getCatalog(connection, catalogName)
        return catalog.entityCollections.findIndex(it => it.entityType === entityType) === -1
    }
}

export function useCollectionItemService(): CollectionItemService {
    return mandatoryInject(collectionItemServiceInjectionKey) as CollectionItemService
}
