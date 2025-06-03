import { MenuFactory } from '@/modules/base/service/menu/MenuFactory'
import { CatalogMenuItemType } from '@/modules/connection-explorer/model/CatalogMenuItemType'
import { MenuItem } from '@/modules/base/model/menu/MenuItem'
import { ApiType } from '@/modules/database-driver/request-response/status/ApiType'
import {
    EvitaQLConsoleTabDefinition
} from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabDefinition'
import {
    GraphQLConsoleTabDefinition
} from '@/modules/graphql-console/console/workspace/model/GraphQLConsoleTabDefinition'
import { GraphQLInstanceType } from '@/modules/graphql-console/console/model/GraphQLInstanceType'
import { SchemaViewerTabDefinition } from '@/modules/schema-viewer/viewer/workspace/model/SchemaViewerTabDefinition'
import { CatalogSchemaPointer } from '@/modules/schema-viewer/viewer/model/CatalogSchemaPointer'
import {
    TrafficRecordHistoryViewerTabDefinition
} from '@/modules/traffic-viewer/model/TrafficRecordHistoryViewerTabDefinition'
import { ServerStatus } from '@/modules/database-driver/request-response/status/ServerStatus'
import { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import { i18n } from '@/vue-plugins/i18n'
import { mandatoryInject } from '@/utils/reactivity'
import { WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { GraphQLConsoleTabFactory } from '@/modules/graphql-console/console/workspace/service/GraphQLConsoleTabFactory'
import { EvitaQLConsoleTabFactory } from '@/modules/evitaql-console/console/workspace/service/EvitaQLConsoleTabFactory'
import { SchemaViewerTabFactory } from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import {
    TrafficRecordHistoryViewerTabFactory
} from '@/modules/traffic-viewer/service/TrafficRecordHistoryViewerTabFactory'

export const catalogItemMenuFactoryInjectionKey: symbol = Symbol('catalogItemMenuFactoryInjectionKey')

export function useCatalogItemMenuFactory(): CatalogItemMenuFactory {
    return mandatoryInject(catalogItemMenuFactoryInjectionKey)
}

/**
 * Factory for creating catalog menu items for current data
 */
export class CatalogItemMenuFactory extends MenuFactory<CatalogMenuItemType> {

    private readonly workspaceService: WorkspaceService
    private readonly evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory
    private readonly graphQLConsoleTabFactory: GraphQLConsoleTabFactory
    private readonly schemaViewerTabFactory: SchemaViewerTabFactory
    private readonly trafficRecordHistoryViewerTabFactory: TrafficRecordHistoryViewerTabFactory

    constructor(
        workspaceService: WorkspaceService,
        evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory,
        graphQLConsoleTabFactory: GraphQLConsoleTabFactory,
        schemaViewerTabFactory: SchemaViewerTabFactory,
        trafficRecordHistoryViewerTabFactory: TrafficRecordHistoryViewerTabFactory
    ) {
        super()
        this.workspaceService = workspaceService
        this.evitaQLConsoleTabFactory = evitaQLConsoleTabFactory
        this.graphQLConsoleTabFactory = graphQLConsoleTabFactory
        this.schemaViewerTabFactory = schemaViewerTabFactory
        this.trafficRecordHistoryViewerTabFactory = trafficRecordHistoryViewerTabFactory
    }

    async createItems(
        serverStatus?: ServerStatus,
        catalog?: CatalogStatistics,
        closeSharedSessionCallback?: () => void,
        renameCatalogCallback?: () => void,
        replaceCatalogCallback?: () => void,
        switchCatalogToAliveStateCallback?: () => void,
        deleteCatalogCallback?: () => void,
        createCollectionCallback?: () => void
    ): Promise<Map<CatalogMenuItemType, MenuItem<CatalogMenuItemType>>> {
        if (catalog == undefined) throw new Error('catalog is not defined!')
        if (closeSharedSessionCallback == undefined) throw new Error('Missing closeSharedSessionCallback')
        if (renameCatalogCallback == undefined) throw new Error('Missing renameCatalogCallback')
        if (replaceCatalogCallback == undefined) throw new Error('Missing replaceCatalogCallback')
        if (switchCatalogToAliveStateCallback == undefined) throw new Error('Missing switchCatalogToAliveStateCallback')
        if (deleteCatalogCallback == undefined) throw new Error('Missing deleteCatalogCallback')
        if (createCollectionCallback == undefined) throw new Error('Missing createCollectionCallback')

        const graphQlEnabled: boolean = serverStatus != undefined && serverStatus.apiEnabled(ApiType.GraphQL)
        const catalogNotCorrupted: boolean = !catalog.corrupted
        const serverWritable: boolean = serverStatus != undefined && !serverStatus.readOnly

        const items: Map<CatalogMenuItemType, MenuItem<CatalogMenuItemType>> = new Map()
        this.createMenuAction(
            items,
            CatalogMenuItemType.EvitaQLConsole,
            EvitaQLConsoleTabDefinition.icon(),
            this.getItemTitle,
            () => {
                this.workspaceService.createTab(
                    this.evitaQLConsoleTabFactory.createNew(catalog.name)
                )
            },
            catalogNotCorrupted
        )
        this.createMenuAction(
            items,
            CatalogMenuItemType.GraphQLDataAPIConsole,
            GraphQLConsoleTabDefinition.icon(),
            this.getItemTitle,
            () => {
                this.workspaceService.createTab(
                    this.graphQLConsoleTabFactory.createNew(
                        catalog.name,
                        GraphQLInstanceType.Data
                    )
                )
            },
            catalogNotCorrupted && graphQlEnabled
        )
        this.createMenuAction(
            items,
            CatalogMenuItemType.GraphQLSchemaAPIConsole,
            GraphQLConsoleTabDefinition.icon(),
            this.getItemTitle,
            () => {
                this.workspaceService.createTab(
                    this.graphQLConsoleTabFactory.createNew(
                        catalog.name,
                        GraphQLInstanceType.Schema
                    )
                )
            },
            catalogNotCorrupted && graphQlEnabled
        )
        this.createMenuAction(
            items,
            CatalogMenuItemType.ViewSchema,
            SchemaViewerTabDefinition.icon(),
            this.getItemTitle,
            () => {
                this.workspaceService.createTab(
                    this.schemaViewerTabFactory.createNew(
                        new CatalogSchemaPointer(catalog.name)
                    )
                )
            },
            catalogNotCorrupted
        )

        this.createMenuSubheader(
            items,
            CatalogMenuItemType.TrafficSubheader,
            this.getItemTitle
        )
        this.createMenuAction(
            items,
            CatalogMenuItemType.ActiveTrafficRecording,
            TrafficRecordHistoryViewerTabDefinition.icon(),
            this.getItemTitle,
            () => this.workspaceService.createTab(
                this.trafficRecordHistoryViewerTabFactory.createNew(
                    catalog.name
                )
            ),
            catalogNotCorrupted && serverWritable
        )

        this.createMenuSubheader(
            items,
            CatalogMenuItemType.ManageSubheader,
            this.getItemTitle
        )
        this.createMenuAction(
            items,
            CatalogMenuItemType.CloseSharedSession,
            'mdi-lan-disconnect',
            this.getItemTitle,
            () => closeSharedSessionCallback()
        )

        this.createMenuSubheader(
            items,
            CatalogMenuItemType.ModifySubheader,
            this.getItemTitle
        )
        this.createMenuAction(
            items,
            CatalogMenuItemType.RenameCatalog,
            'mdi-pencil-outline',
            this.getItemTitle,
            () => renameCatalogCallback(),
            catalogNotCorrupted && serverWritable
        )
        this.createMenuAction(
            items,
            CatalogMenuItemType.ReplaceCatalog,
            'mdi-file-replace-outline',
            this.getItemTitle,
            () => replaceCatalogCallback(),
            catalogNotCorrupted && serverWritable
        )
        if (catalog.isInWarmup) {
            this.createMenuAction(
                items,
                CatalogMenuItemType.SwitchCatalogToAliveState,
                'mdi-toggle-switch-outline',
                this.getItemTitle,
                () => switchCatalogToAliveStateCallback(),
                catalogNotCorrupted && serverWritable
            )
        }
        this.createMenuAction(
            items,
            CatalogMenuItemType.DeleteCatalog,
            'mdi-delete-outline',
            this.getItemTitle,
            () => deleteCatalogCallback(),
            serverWritable
        )

        this.createMenuSubheader(
            items,
            CatalogMenuItemType.CollectionsSubheader,
            this.getItemTitle,
        )

        this.createMenuAction(
            items,
            CatalogMenuItemType.CreateCollection,
            'mdi-plus',
            this.getItemTitle,
            () => createCollectionCallback(),
            catalogNotCorrupted && serverWritable
        )

        return items
    }

    protected getItemTitle(itemType: CatalogMenuItemType): string {
        return i18n.global.t(`explorer.catalog.menu.item.${itemType}`)
    }

}
