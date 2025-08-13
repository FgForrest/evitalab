import { MenuFactory } from '@/modules/base/service/menu/MenuFactory'
import { CatalogMenuItemType } from '@/modules/connection-explorer/model/CatalogMenuItemType'
import type { MenuItem } from '@/modules/base/model/menu/MenuItem'
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
import { CatalogState } from '@/modules/database-driver/request-response/CatalogState.ts'

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
        duplicateCatalogCallback?: () => void,
        replaceCatalogCallback?: () => void,
        mutateCatalogCallback?: () => void,
        immutableCatalogCallback?: () => void,
        activateCatalogCallback?: () => void,
        deactivateCatalogCallback?: () => void,
        switchCatalogToAliveStateCallback?: () => void,
        deleteCatalogCallback?: () => void,
        createCollectionCallback?: () => void,
        backupCatalogCallback?: () => void,
        state?: CatalogState
    ): Promise<Map<CatalogMenuItemType, MenuItem<CatalogMenuItemType>>> {
        if (catalog == undefined) throw new Error('catalog is not defined!')
        if (closeSharedSessionCallback == undefined) throw new Error('Missing closeSharedSessionCallback')
        if (renameCatalogCallback == undefined) throw new Error('Missing renameCatalogCallback')
        if (duplicateCatalogCallback == undefined) throw new Error('Missing duplicateCatalogCallback')
        if (replaceCatalogCallback == undefined) throw new Error('Missing replaceCatalogCallback')
        if (switchCatalogToAliveStateCallback == undefined) throw new Error('Missing switchCatalogToAliveStateCallback')
        if (deleteCatalogCallback == undefined) throw new Error('Missing deleteCatalogCallback')
        if (createCollectionCallback == undefined) throw new Error('Missing createCollectionCallback')
        if (backupCatalogCallback == undefined) throw new Error('Missing backupCatalogCallback')
        if (activateCatalogCallback == undefined) throw new Error('Missing activateCatalogCallback')
        if (deactivateCatalogCallback == undefined) throw new Error('Missing deleteCatalogCallback')
        if (mutateCatalogCallback == undefined) throw new Error('Missing mutateCatalogCallback')
        if (immutableCatalogCallback == undefined) throw new Error('Missing mutateCatalogCallback')

        const graphQlEnabled: boolean = serverStatus != undefined && serverStatus.apiEnabled(ApiType.GraphQL)
        const serverWritable: boolean = serverStatus != undefined && !serverStatus.readOnly && !catalog.readOnly
        const baseEnabledFunctions: boolean = !catalog.unusable && state === CatalogState.Alive
        const deactivated: boolean = state === CatalogState.Inactive

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
            baseEnabledFunctions
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
            baseEnabledFunctions && graphQlEnabled
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
            baseEnabledFunctions && graphQlEnabled
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
            baseEnabledFunctions
        )
        this.createMenuAction(items,
            CatalogMenuItemType.Backup,
            'mdi-cloud-download-outline',
            this.getItemTitle,
            () => backupCatalogCallback(),
            baseEnabledFunctions && !serverStatus?.readOnly
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
            baseEnabledFunctions && serverWritable
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
            baseEnabledFunctions && serverWritable
        )
        this.createMenuAction(
            items,
            CatalogMenuItemType.DuplicateCatalog,
            'mdi-content-duplicate',
            this.getItemTitle,
            () => duplicateCatalogCallback(),
            baseEnabledFunctions && serverWritable
        )
        this.createMenuAction(
            items,
            CatalogMenuItemType.ReplaceCatalog,
            'mdi-file-replace-outline',
            this.getItemTitle,
            () => replaceCatalogCallback(),
            baseEnabledFunctions && serverWritable
        )
        if(baseEnabledFunctions) {
            this.createMenuAction(
                items,
                CatalogMenuItemType.DeactivateCatalog,
                'mdi-close-circle-outline',
                this.getItemTitle,
                () => deactivateCatalogCallback(),
                baseEnabledFunctions && !serverStatus?.readOnly
            )
        }
        if(deactivated) {
            this.createMenuAction(
                items,
                CatalogMenuItemType.ActivateCatalog,
                'mdi-check-circle-outline',
                this.getItemTitle,
                () => activateCatalogCallback(),
                deactivated
            )
        }
        if(catalog.readOnly) {
            this.createMenuAction(
                items,
                CatalogMenuItemType.SwitchToMutable,
                'mdi-lock-open-variant-outline',
                this.getItemTitle,
                () => mutateCatalogCallback(),
                baseEnabledFunctions)
        }
        if(!catalog.readOnly) {
            this.createMenuAction(
                items,
                CatalogMenuItemType.SwitchToImmutable,
                'mdi-lock-outline',
                this.getItemTitle,
                () => immutableCatalogCallback(),
                baseEnabledFunctions && serverWritable
            )
        }

        if (catalog.isInWarmup) {
            this.createMenuAction(
                items,
                CatalogMenuItemType.SwitchCatalogToAliveState,
                'mdi-toggle-switch-outline',
                this.getItemTitle,
                () => switchCatalogToAliveStateCallback(),
                baseEnabledFunctions && serverWritable
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
            this.getItemTitle
        )

        this.createMenuAction(
            items,
            CatalogMenuItemType.CreateCollection,
            'mdi-plus',
            this.getItemTitle,
            () => createCollectionCallback(),
            baseEnabledFunctions && serverWritable
        )

        return items
    }

    protected getItemTitle(itemType: CatalogMenuItemType): string {
        return i18n.global.t(`explorer.catalog.menu.item.${itemType}`)
    }

}
