import type { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { Connection } from '@/modules/connection/model/Connection'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import type { TabFactory } from '@/modules/workspace/tab/service/TabFactory'
import type { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import type { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'
import { CatalogViewerTabDefinition } from '@/modules/catalog-viewer/model/CatalogViewerTabDefinition'
import { CatalogViewerTabParams } from '@/modules/catalog-viewer/model/CatalogViewerTabParams'
import type { CatalogViewerTabParamsDto } from '@/modules/catalog-viewer/model/CatalogViewerTabParamsDto'
import { CatalogViewerTabData } from '@/modules/catalog-viewer/model/CatalogViewerTabData'
import type { CatalogViewerTabDataDto } from '@/modules/catalog-viewer/model/CatalogViewerTabDataDto'
import { CatalogViewerPage } from '@/modules/catalog-viewer/model/CatalogViewerPage'

export const catalogViewerTabFactoryInjectionKey: InjectionKey<CatalogViewerTabFactory> =
    Symbol('catalogViewerTabFactory')

/**
 * Creates and restores catalog preview tabs. The selected page travels in the tab data, so a restored or shared
 * tab reopens on the page it was left at.
 */
export class CatalogViewerTabFactory implements TabFactory {

    readonly tabType: TabType = TabType.CatalogViewer
    readonly restorable: boolean = true

    private readonly connectionService: ConnectionService

    constructor(connectionService: ConnectionService) {
        this.connectionService = connectionService
    }

    createNew(catalogName: string, page?: CatalogViewerPage): CatalogViewerTabDefinition {
        const connection: Connection = this.connectionService.getConnection()
        return new CatalogViewerTabDefinition(
            this.constructTitle(catalogName),
            new CatalogViewerTabParams(connection, catalogName),
            new CatalogViewerTabData(page)
        )
    }

    restoreFromJson(paramsJson: TabParamsDto, dataJson?: TabDataDto): CatalogViewerTabDefinition {
        const paramsDto: CatalogViewerTabParamsDto = paramsJson as CatalogViewerTabParamsDto
        const dataDto: CatalogViewerTabDataDto | undefined = dataJson as CatalogViewerTabDataDto | undefined
        return new CatalogViewerTabDefinition(
            this.constructTitle(paramsDto.catalogName),
            new CatalogViewerTabParams(
                this.connectionService.getConnection(paramsDto.connectionId),
                paramsDto.catalogName
            ),
            new CatalogViewerTabData(dataDto?.page)
        )
    }

    private constructTitle(catalogName: string): string {
        return catalogName
    }
}

export const useCatalogViewerTabFactory = (): CatalogViewerTabFactory => {
    return mandatoryInject(catalogViewerTabFactoryInjectionKey) as CatalogViewerTabFactory
}
