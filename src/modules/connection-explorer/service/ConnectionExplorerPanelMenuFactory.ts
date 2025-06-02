import { ConnectionMenuItemType } from '@/modules/connection-explorer/model/ConnectionMenuItemType'
import { MenuItem } from '@/modules/base/model/menu/MenuItem'
import { i18n } from '@/vue-plugins/i18n'
import {
    GraphQLConsoleTabDefinition
} from '@/modules/graphql-console/console/workspace/model/GraphQLConsoleTabDefinition'
import { BackupViewerTabDefinition } from '@/modules/backup-viewer/model/BackupViewerTabDefinition'
import { JfrViewerTabDefinition } from '@/modules/jfr-viewer/model/JfrViewerTabDefinition'
import {
    TrafficRecordingsViewerTabDefinition
} from '@/modules/traffic-viewer/model/TrafficRecordingsViewerTabDefinition'
import { TaskViewerTabDefinition } from '@/modules/task-viewer/model/TaskViewerTabDefinition'
import { ServerViewerTabDefinition } from '@/modules/server-viewer/model/ServerViewerTabDefinition'
import { WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { ServerViewerTabFactory } from '@/modules/server-viewer/service/ServerViewerTabFactory'
import { GraphQLInstanceType } from '@/modules/graphql-console/console/model/GraphQLInstanceType'
import { TaskViewerTabFactory } from '@/modules/task-viewer/services/TaskViewerTabFactory'
import { TrafficRecordingsViewerTabFactory } from '@/modules/traffic-viewer/service/TrafficRecordingsViewerTabFactory'
import { GraphQLConsoleTabFactory } from '@/modules/graphql-console/console/workspace/service/GraphQLConsoleTabFactory'
import { BackupViewerTabFactory } from '@/modules/backup-viewer/service/BackupViewerTabFactory'
import { ServerStatus } from '@/modules/database-driver/request-response/status/ServerStatus'
import { ApiType } from '@/modules/database-driver/request-response/status/ApiType'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { JfrViewerTabFactory } from '@/modules/jfr-viewer/service/JfrViewerTabFactory'
import { MenuFactory } from '@/modules/base/service/menu/MenuFactory'

export const connectionExplorerPanelMenuFactoryInjectionKey: InjectionKey<ConnectionExplorerPanelMenuFactory> = Symbol('connectionExplorerPanelMenuFactoryInjectionKey')

export function useConnectionExplorerPanelMenuFactory(): ConnectionExplorerPanelMenuFactory {
    return mandatoryInject(connectionExplorerPanelMenuFactoryInjectionKey)
}

/**
 * Factory for creating connection menu items for current data
 */
export class ConnectionExplorerPanelMenuFactory extends MenuFactory<ConnectionMenuItemType> {

    private readonly evitaClient: EvitaClient
    private readonly workspaceService: WorkspaceService
    private readonly serverViewerTabFactory: ServerViewerTabFactory
    private readonly taskViewerTabFactory: TaskViewerTabFactory
    private readonly trafficRecordingsViewerTabFactory: TrafficRecordingsViewerTabFactory
    private readonly jfrViewerTabFactory: JfrViewerTabFactory
    private readonly graphQLConsoleTabFactory: GraphQLConsoleTabFactory
    private readonly backupViewerTabFactory: BackupViewerTabFactory

    constructor(
        evitaClient: EvitaClient,
        workspaceService: WorkspaceService,
        serverViewerTabFactory: ServerViewerTabFactory,
        taskViewerTabFactory: TaskViewerTabFactory,
        trafficRecordingsViewerTabFactory: TrafficRecordingsViewerTabFactory,
        jfrViewerTabFactory: JfrViewerTabFactory,
        graphQLConsoleTabFactory: GraphQLConsoleTabFactory,
        backupViewerTabFactory: BackupViewerTabFactory
    ) {
        super()
        this.evitaClient = evitaClient
        this.workspaceService = workspaceService
        this.serverViewerTabFactory = serverViewerTabFactory
        this.taskViewerTabFactory = taskViewerTabFactory
        this.trafficRecordingsViewerTabFactory = trafficRecordingsViewerTabFactory
        this.jfrViewerTabFactory = jfrViewerTabFactory
        this.graphQLConsoleTabFactory = graphQLConsoleTabFactory
        this.backupViewerTabFactory = backupViewerTabFactory
    }

    async createItems(
        serverStatus?: ServerStatus,
        createCatalogCallback?: () => void,
        reloadStartedCallback?: () => void,
        reloadFinishedCallback?: () => void
    ): Promise<Map<ConnectionMenuItemType, MenuItem<ConnectionMenuItemType>>> {
        if (createCatalogCallback == undefined) {
            throw new Error('createCatalogCallback is not defined!')
        }

        const graphQlEnabled: boolean = serverStatus != undefined && serverStatus.apiEnabled(ApiType.GraphQL)
        const observabilityEnabled: boolean = serverStatus != undefined && serverStatus.apiEnabled(ApiType.Observability)
        const serverReady: boolean = serverStatus != undefined
        const serverWritable: boolean = serverReady && !serverStatus!.readOnly

        const actions: Map<ConnectionMenuItemType, MenuItem<ConnectionMenuItemType>> = new Map()
        this.createMenuAction(
            actions,
            ConnectionMenuItemType.Server,
            ServerViewerTabDefinition.icon(),
            () =>
                this.workspaceService.createTab(
                    this.serverViewerTabFactory.createNew()
                ),
            serverReady
        )
        this.createMenuAction(
            actions,
            ConnectionMenuItemType.Tasks,
            TaskViewerTabDefinition.icon(),
            () => {
                this.workspaceService.createTab(
                    this.taskViewerTabFactory.createNew()
                )
            },
            serverWritable
        )
        this.createMenuAction(
            actions,
            ConnectionMenuItemType.TrafficRecordings,
            TrafficRecordingsViewerTabDefinition.icon(),
            () => {
                this.workspaceService.createTab(
                    this.trafficRecordingsViewerTabFactory.createNew()
                )
            },
            serverWritable
        )
        this.createMenuAction(
            actions,
            ConnectionMenuItemType.JfrRecordings,
            JfrViewerTabDefinition.icon(),
            () => {
                this.workspaceService.createTab(
                    this.jfrViewerTabFactory.createNew()
                )
            },
            serverWritable && observabilityEnabled
        )
        this.createMenuAction(
            actions,
            ConnectionMenuItemType.GraphQLSystemAPIConsole,
            GraphQLConsoleTabDefinition.icon(),
            () =>
                this.workspaceService.createTab(
                    this.graphQLConsoleTabFactory.createNew(
                        'system', // todo lho: this is not needed
                        GraphQLInstanceType.System
                    )
                ),
            graphQlEnabled
        )

        this.createMenuSubheader(
            actions,
            ConnectionMenuItemType.ManageSubheader
        )
        this.createMenuAction(
            actions,
            ConnectionMenuItemType.Reload,
            'mdi-refresh',
            () => {
                if (reloadStartedCallback != undefined) {
                    reloadStartedCallback()
                }
                this.evitaClient.clearCache()
                    .then(() => {
                        if (reloadFinishedCallback != undefined) {
                            reloadFinishedCallback()
                        }
                    })
            }
        )

        this.createMenuSubheader(
            actions,
            ConnectionMenuItemType.CatalogsSubheader
        )
        this.createMenuAction(
            actions,
            ConnectionMenuItemType.CreateCatalog,
            'mdi-plus',
            createCatalogCallback,
            serverWritable
        )
        this.createMenuAction(
            actions,
            ConnectionMenuItemType.CatalogBackups,
            BackupViewerTabDefinition.icon(),
            () => {
                this.workspaceService.createTab(
                    this.backupViewerTabFactory.createNew()
                )
            },
            serverWritable
        )
        return actions
    }

    protected getItemTitle(itemType: ConnectionMenuItemType): string {
        return i18n.global.t(`explorer.connection.menu.item.${itemType}`)
    }
}
