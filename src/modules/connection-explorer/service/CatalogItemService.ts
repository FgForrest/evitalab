import type { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { ClassifierValidationErrorType } from '@/modules/database-driver/data-type/ClassifierValidationErrorType'
import { ClassifierType } from '@/modules/database-driver/data-type/ClassifierType'
import { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { List as ImmutableList } from 'immutable'
import { MutationProgressType } from '@/modules/connection-explorer/model/MutationProgressType.ts'
import type { Toaster } from '@/modules/notification/service/Toaster.ts'
import { i18n } from '@/vue-plugins/i18n.ts'

export const catalogItemServiceInjectionKey: InjectionKey<CatalogItemService> = Symbol('catalogItemService')

/**
 * Handles custom actions for the CatalogItem tree item
 */
export class CatalogItemService {
    private readonly evitaClient: EvitaClient
    private readonly toaster: Toaster

    constructor(evitaClient: EvitaClient, toaster: Toaster) {
        this.evitaClient = evitaClient
        this.toaster = toaster
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

    duplicateCatalogWithProgress(catalog: CatalogStatistics, newCatalogName: string): void {
        const interval = async () => {
            try {
                for await (const progress of this.evitaClient.duplicateCatalogWithProgress(catalog.name, newCatalogName)) {
                    catalog.setProgress(MutationProgressType.Duplication, progress.progressInPercent)
                }

                await this.toaster.success(i18n.global.t('explorer.catalog.duplication.notification.catalogDuplicated'))
            } catch (e: unknown) {
                catalog.removeProgress(MutationProgressType.Duplication)
                await this.toaster.error(i18n.global.t('explorer.catalog.duplication.notification.couldNotDuplicateCatalog',
                    {
                        catalogName: catalog.name,
                        reason: e instanceof Error ? e.message : String(e)
                    }))
            }
        }

        void interval().then(async () => await this.evitaClient.management.clearCatalogStatisticsCache())
    }

    renameCatalogWithProgress(catalog: CatalogStatistics, newCatalogName: string): void {
        const internal = async () => {
            try {
                for await (const progress of this.evitaClient.renameCatalogWithProgress(catalog.name, newCatalogName)) {
                    catalog.setProgress(MutationProgressType.Renaming, progress.progressInPercent)
                }

                await this.toaster.success(i18n.global.t('explorer.collection.rename.notification.collectionRenamed'))
            } catch (e: unknown) {
                catalog.removeProgress(MutationProgressType.Renaming)
                await this.toaster.error(i18n.global.t('explorer.catalog.rename.notification.couldNotRenameCatalog',
                    {
                        catalogName: catalog.name,
                        reason: e instanceof Error ? e.message : String(e)
                    }))
            }
        }

        void internal().then(async () => await this.evitaClient.management.clearCatalogStatisticsCache())
    }

    activateCatalogWithProgress(catalog: CatalogStatistics): void {
        const internal = async () => {
            try {
                for await (const progress of this.evitaClient.activateCatalogWithProgress(catalog.name)) {
                    catalog.setProgress(MutationProgressType.Activation, progress.progressInPercent)
                }

                await this.toaster.success(i18n.global.t('explorer.catalog.activateCatalog.notification.catalogActivated'))
            } catch (e: unknown) {
                catalog.removeProgress(MutationProgressType.Activation)
                await this.toaster.error(i18n.global.t('explorer.catalog.activateCatalog.notification.couldNotActivateCatalog', {
                    catalogName: catalog.name,
                    reason: e instanceof Error ? e.message : String(e)
                }))
            }
        }

        void internal().then(async () =>
            await this.evitaClient.management.clearCatalogStatisticsCache()
        )
    }

    deactivateCatalogWithProgress(catalog: CatalogStatistics): void {
        const internal = async () => {
            try {
                for await (const progress of this.evitaClient.deactivateCatalogWithProgress(catalog.name)) {
                    catalog.setProgress(MutationProgressType.Deactivation, progress.progressInPercent)
                }

                await this.toaster.success(i18n.global.t('explorer.catalog.deactivateCatalog.notification.catalogDeactivated'))
            } catch (e: unknown) {
                catalog.removeProgress(MutationProgressType.Deactivation)
                await this.toaster.error(i18n.global.t('explorer.catalog.deactivateCatalog.notification.couldNotDeactivateCatalog', {
                    catalogName: catalog.name,
                    reason: e instanceof Error ? e.message : String(e)
                }))
            }
        }

        void internal().then(async () => await this.evitaClient.management.clearCatalogStatisticsCache())
    }

    replaceCatalogWithProgress(catalog: CatalogStatistics, newCatalogName: string): void {
        const internal = async () => {
            try {
                for await (const progress of this.evitaClient.replaceCatalogWithProgress(catalog.name, newCatalogName)) {
                    catalog.setProgress(MutationProgressType.Replacing, progress.progressInPercent)
                }

                await this.toaster.success(i18n.global.t('explorer.catalog.replace.notification.catalogReplaced'))
            } catch (e: unknown) {
                catalog.removeProgress(MutationProgressType.Replacing)
                await this.toaster.error(i18n.global.t('explorer.catalog.replace.notification.couldNotReplaceCatalog',
                    {
                        catalogNameToBeReplaced: catalog.name,
                        reason: e instanceof Error ? e.message : String(e)
                    }))
            }
        }

        void internal().then(async () => await this.evitaClient.clearCache())
    }

    makeCatalogMutableWithProgress(catalog: CatalogStatistics): void {
        const internal = async () => {
            try {
                for await (const progress of this.evitaClient.makeCatalogMutable(catalog.name)) {
                    catalog.setProgress(MutationProgressType.Mutable, progress.progressInPercent)
                }

                await this.toaster.success(i18n.global.t('explorer.catalog.makeCatalogMutable.notification.catalogMadeAsMutable'))
            } catch (e: unknown) {
                catalog.removeProgress(MutationProgressType.Mutable)
                await this.toaster.error(i18n.global.t('explorer.catalog.makeCatalogMutable.notification.couldNotMakeCatalogMutable', {
                    catalogName: catalog.name,
                    reason: e instanceof Error ? e.message : String(e)
                }))
            }
        }

        void internal().then(async () => await this.evitaClient.clearCache())
    }

    makeCatalogImmutableWithProgress(catalog: CatalogStatistics): void {
        const internal = async () => {
            try {
                for await (const progress of this.evitaClient.makeCatalogImmutableWithProgress(catalog.name)) {
                    catalog.setProgress(MutationProgressType.Immutable, progress.progressInPercent)
                }

                await this.toaster.success(i18n.global.t('explorer.catalog.makeCatalogImmutable.notification.catalogMadeAsImmutable'))
            } catch (e: unknown) {
                catalog.removeProgress(MutationProgressType.Immutable)
                await this.toaster.error(i18n.global.t('explorer.catalog.makeCatalogImmutable.notification.couldNotMakeCatalogImmutable', {
                    catalogName: catalog.name,
                    reason: e instanceof Error ? e.message : String(e)
                }))
            }
        }

        void internal().then(async () => await this.evitaClient.clearCache())
    }

    switchCatalogAliveWithProgress(catalog: CatalogStatistics): void {
        const internal = async () => {
            try {
                for await (const progress of this.evitaClient.makeCatalogAliveWithProgress(catalog.name)) {
                    catalog.setProgress(MutationProgressType.Alive, progress.progressInPercent)
                }

                await this.toaster.success(i18n.global.t('explorer.catalog.switchToAliveState.notification.catalogSwitched'))
            } catch (e: unknown) {
                catalog.removeProgress(MutationProgressType.Alive)
                await this.toaster.error(i18n.global.t('explorer.catalog.switchToAliveState.notification.couldNotSwitchCatalog',
                    {
                        catalogName: catalog.name,
                        reason: e instanceof Error ? e.message : String(e)
                    }))
            }
        }

        void internal().then(async () => await this.evitaClient.clearCache())
    }
}

export function useCatalogItemService(): CatalogItemService {
    return mandatoryInject(catalogItemServiceInjectionKey)
}
