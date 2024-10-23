import { Connection } from '@/modules/connection/model/Connection'
import { OffsetDateTime } from '@/modules/connection/model/data-type/OffsetDateTime'
import { Uuid } from '@/modules/connection/model/data-type/Uuid'
import { mandatoryInject } from '@/utils/reactivity'
import { InjectionKey } from 'vue'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { CatalogVersionAtResponse } from '@/modules/connection/model/CatalogVersionAtResponse'
import { TaskStatus } from '@/modules/connection/model/task/TaskStatus'
import { ClassifierValidationErrorType } from '@/modules/connection/model/data-type/ClassifierValidationErrorType'
import { EvitaDBDriver } from '@/modules/connection/driver/EvitaDBDriver'
import { ClassifierType } from '@/modules/connection/model/data-type/ClassifierType'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { PaginatedList } from '@/modules/connection/model/PaginatedList'
import { ServerFile } from '@/modules/connection/model/server-file/ServerFile'
import { backupTaskName } from '@/modules/backup-viewer/model/BackupTask'
import { Catalog } from '@/modules/connection/model/Catalog'
import Immutable from 'immutable'

export const backupViewerServiceInjectionKey: InjectionKey<BackupViewerService> = Symbol('backupViewerService')

export class BackupViewerService {
    private readonly connectionService: ConnectionService

    constructor(connectionService: ConnectionService) {
        this.connectionService = connectionService
    }

    async getAvailableCatalogs(connection: Connection): Promise<Immutable.List<Catalog>> {
        return this.connectionService.getCatalogs(connection, true)
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

    async getMinimalBackupDate(
        connection: Connection,
        catalogName: string
    ): Promise<CatalogVersionAtResponse> {
        const driver = await this.connectionService.getDriver(connection)
        return driver.getMinimalBackupDate(connection, catalogName)
    }

    async backupCatalog(
        connection: Connection,
        catalogName: string,
        includingWAL: boolean,
        pastMoment: OffsetDateTime | undefined
    ): Promise<TaskStatus> {
        const driver = await this.connectionService.getDriver(connection)
        return driver.createBackup(
            connection,
            catalogName,
            includingWAL,
            pastMoment
        )
    }

    async getBackupFiles(
        connection: Connection,
        pageNumber: number,
        pageSize: number
    ): Promise<PaginatedList<ServerFile>> {
        const driver = await this.connectionService.getDriver(connection)
        return await driver.getFilesToFetch(connection, backupTaskName, pageNumber, pageSize)
    }

    async restoreBackupFile(
        connection: Connection,
        fileId: Uuid,
        catalogName: string
    ): Promise<TaskStatus> {
        const driver = await this.connectionService.getDriver(connection)
        return await driver.restoreCatalogFromServerFile(connection, fileId, catalogName)
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

    async restoreLocalBackupFile(connection: Connection, file: Blob, catalogName: string): Promise<TaskStatus> {
        const driver = await this.connectionService.getDriver(connection)
        return await driver.restoreCatalog(connection, file, catalogName)
    }
}

export const useBackupViewerService = (): BackupViewerService => {
    return mandatoryInject(backupViewerServiceInjectionKey) as BackupViewerService
}
