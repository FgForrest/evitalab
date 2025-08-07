import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import { mandatoryInject } from '@/utils/reactivity'
import type { InjectionKey } from 'vue'
import { CatalogVersionAtResponse } from '@/modules/database-driver/request-response/CatalogVersionAtResponse'
import { TaskStatus } from '@/modules/database-driver/request-response/task/TaskStatus'
import { ClassifierValidationErrorType } from '@/modules/database-driver/data-type/ClassifierValidationErrorType'
import { ClassifierType } from '@/modules/database-driver/data-type/ClassifierType'
import { PaginatedList } from '@/modules/database-driver/request-response/PaginatedList'
import { ServerFile } from '@/modules/database-driver/request-response/server-file/ServerFile'
import { backupTaskName } from '@/modules/backup-viewer/model/BackupTask'
import { List as ImmutableList } from 'immutable'
import { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { fullBackupTaskName } from '@/modules/backup-viewer/model/FullBackupTask.ts'

export const backupViewerServiceInjectionKey: InjectionKey<BackupViewerService> = Symbol('backupViewerService')

export class BackupViewerService {
    private readonly evitaClient: EvitaClient

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
    }

    registerAvailableCatalogsChangeCallback(callback: () => Promise<void>): string {
        return this.evitaClient.management.registerCatalogStatisticsChangeCallback(callback)
    }

    unregisterAvailableCatalogsChangeCallback(id: string): void {
        this.evitaClient.management.unregisterCatalogStatisticsChangeCallback(id)
    }

    async getAvailableCatalogs(): Promise<ImmutableList<CatalogStatistics>> {
        return await this.evitaClient.management.getCatalogStatistics()
    }

    async isCatalogExists(catalogName: string): Promise<boolean> {
        return (await this.evitaClient.getCatalogNames()).contains(catalogName)
    }

    async getMinimalBackupDate(catalogName: string): Promise<CatalogVersionAtResponse> {
        return await this.evitaClient.queryCatalog(catalogName, async session => {
            return await session.getCatalogVersionAt()
        })
    }

    async backupCatalog(
        catalogName: string,
        pastMoment: OffsetDateTime | undefined,
        includingWAL: boolean
    ): Promise<TaskStatus> {
        return await this.evitaClient.management.backupCatalog(
            catalogName,
            pastMoment,
            includingWAL
        )
    }

    async fullBackupCatalog(catalogName: string): Promise<TaskStatus> {
        return await this.evitaClient.management.fullBackupCatalog(catalogName)
    }

    async getBackupFiles(
        pageNumber: number,
        pageSize: number
    ): Promise<PaginatedList<ServerFile>> {
        return await this.evitaClient.management.listFilesToFetch(
            pageNumber,
            pageSize,
            [backupTaskName, fullBackupTaskName],
        )
    }


    async restoreBackupFile(
        fileId: Uuid,
        catalogName: string
    ): Promise<TaskStatus> {
        return await this.evitaClient.management.restoreCatalogFromServerFile(
            fileId,
            catalogName
        )
    }

    async isCatalogNameValid(catalogName: string): Promise<ClassifierValidationErrorType | undefined> {
        return await this.evitaClient.management.isClassifierValid(
            ClassifierType.Catalog,
            catalogName
        )
    }

    async isCatalogNameAvailable(catalogName: string): Promise<boolean> {
        return !(await this.isCatalogExists(catalogName))
    }

    async restoreLocalBackupFile(file: Blob, catalogName: string): Promise<TaskStatus> {
        return await this.evitaClient.management.restoreCatalog(
            file,
            catalogName
        )
    }
}

export const useBackupViewerService = (): BackupViewerService => {
    return mandatoryInject(backupViewerServiceInjectionKey) as BackupViewerService
}
