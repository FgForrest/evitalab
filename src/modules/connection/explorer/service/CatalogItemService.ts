import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { Connection } from '@/modules/connection/model/Connection'
import { Catalog } from '@/modules/connection/model/Catalog'
import { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { ClassifierValidationErrorType } from '@/modules/connection/model/data-type/ClassifierValidationErrorType'
import { EvitaDBDriver } from '@/modules/connection/driver/EvitaDBDriver'
import { ClassifierType } from '@/modules/connection/model/data-type/ClassifierType'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'

export const catalogItemServiceInjectionKey: InjectionKey<CatalogItemService> = Symbol('catalogItemService')

/**
 * Handles custom actions for the CatalogItem tree item
 */
export class CatalogItemService {
    private readonly connectionService: ConnectionService

    constructor(connectionService: ConnectionService) {
        this.connectionService = connectionService
    }

    async getCatalogs(connection: Connection): Promise<Catalog[]> {
        const driver = await this.connectionService.getDriver(connection)
        return await driver.getCatalogs(connection)
    }

    async createCatalog(
        connection: Connection,
        catalogName: string
    ): Promise<boolean> {
        const driver = await this.connectionService.getDriver(connection)
        return await driver.createCatalog(connection, catalogName)
    }

    async dropCatalog(
        connection: Connection,
        catalog: string
    ): Promise<boolean> {
        const driver = await this.connectionService.getDriver(connection)
        return await driver.dropCatalog(connection, catalog)
    }

    async renameCatalog(
        connection: Connection,
        catalogName: string,
        newCatalogName: string
    ): Promise<boolean> {
        const driver = await this.connectionService.getDriver(connection)
        return await driver.renameCatalog(
            connection,
            catalogName,
            newCatalogName
        )
    }

    async replaceCatalog(
        connection: Connection,
        catalogNameToBeReplacedWith: string,
        catalogNameToBeReplaced: string
    ): Promise<boolean> {
        const driver = await this.connectionService.getDriver(connection)
        return await driver.replaceCatalog(
            connection,
            catalogNameToBeReplacedWith,
            catalogNameToBeReplaced
        )
    }

    async switchCatalogToAliveState(connection: Connection, catalogName: string): Promise<boolean> {
        const driver: EvitaDBDriver = await this.connectionService.getDriver(connection)
        return driver.switchCatalogToAliveState(connection, catalogName)
    }

    async isCatalogNameValid(connection: Connection, catalogName: string): Promise<ClassifierValidationErrorType | undefined> {
        const driver: EvitaDBDriver = await this.connectionService.getDriver(connection)
        return driver.isClassifierValid(connection, ClassifierType.Catalog, catalogName)
    }

    async isCatalogNameAvailable(connection: Connection, catalogName: string): Promise<boolean> {
        const driver: EvitaDBDriver = await this.connectionService.getDriver(connection)
        try {
            await driver.getCatalog(connection, catalogName)
        } catch (e) {
            // todo lho better exceptions
            if (e instanceof UnexpectedError) {
                // catalog not found
                return true
            }
        }
        return false
    }

    async isCatalogExists(connection: Connection, catalogName: string): Promise<boolean> {
        const driver: EvitaDBDriver = await this.connectionService.getDriver(connection)
        try {
            await driver.getCatalog(connection, catalogName)
            return true
        } catch (e) {
            return false
        }
    }
}

export function useCatalogItemService(): CatalogItemService {
    return mandatoryInject(catalogItemServiceInjectionKey) as CatalogItemService
}
