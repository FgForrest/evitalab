import { MenuFactory } from '@/modules/base/service/menu/MenuFactory'
import { CollectionMenuItemType } from '@/modules/connection-explorer/model/CollectionMenuItemType'
import { MenuItem } from '@/modules/base/model/menu/MenuItem'
import { EntityViewerTabDefinition } from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabDefinition'
import { SchemaViewerTabDefinition } from '@/modules/schema-viewer/viewer/workspace/model/SchemaViewerTabDefinition'
import { EntitySchemaPointer } from '@/modules/schema-viewer/viewer/model/EntitySchemaPointer'
import { ServerStatus } from '@/modules/database-driver/request-response/status/ServerStatus'
import { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import { EntityCollectionStatistics } from '@/modules/database-driver/request-response/EntityCollectionStatistics'
import { WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { SchemaViewerTabFactory } from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { i18n } from '@/vue-plugins/i18n'
import { EntityViewerTabFactory } from '@/modules/entity-viewer/viewer/workspace/service/EntityViewerTabFactory'

export const collectionItemMenuFactoryInjectionKey: InjectionKey<CollectionItemMenuFactory> = Symbol('collectionItemMenuFactoryInjectionKey')

export function useCollectionItemMenuFactory(): CollectionItemMenuFactory {
    return mandatoryInject(collectionItemMenuFactoryInjectionKey)
}

/**
 * A factory class responsible for creating menu items specifically for collection-related actions.
 */
export class CollectionItemMenuFactory extends MenuFactory<CollectionMenuItemType> {

    private readonly workspaceService: WorkspaceService
    private readonly entityViewerTabFactory: EntityViewerTabFactory
    private readonly schemaViewerTabFactory: SchemaViewerTabFactory

    constructor(
        workspaceService: WorkspaceService,
        entityViewerTabFactory: EntityViewerTabFactory,
        schemaViewerTabFactory: SchemaViewerTabFactory
    ) {
        super()
        this.workspaceService = workspaceService
        this.entityViewerTabFactory = entityViewerTabFactory
        this.schemaViewerTabFactory = schemaViewerTabFactory
    }

    async createItems(
        serverStatus?: ServerStatus,
        catalog?: CatalogStatistics,
        entityCollection?: EntityCollectionStatistics,
        renameCollectionCallback?: () => void,
        deleteCollectionCallback?: () => void
    ): Promise<Map<CollectionMenuItemType, MenuItem<CollectionMenuItemType>>> {
        if (catalog == undefined) throw new Error('catalog is not defined!')
        if (entityCollection == undefined) throw new Error('entityCollection is not defined!')
        if (renameCollectionCallback == undefined) throw new Error('Missing renameCollectionCallback')
        if (deleteCollectionCallback == undefined) throw new Error('Missing deleteCollectionCallback')

        const serverWritable: boolean = serverStatus != undefined && !serverStatus.readOnly

        const items: Map<CollectionMenuItemType, MenuItem<CollectionMenuItemType>> = new Map()
        this.createMenuAction(
            items,
            CollectionMenuItemType.Entities,
            EntityViewerTabDefinition.icon(),
            this.getItemTitle,
            () => this.workspaceService.createTab(
                this.entityViewerTabFactory.createNew(
                    catalog.name,
                    entityCollection.entityType,
                    undefined,
                    true // we want to display data to user right away, there is no malicious code here
                )
            )
        )
        this.createMenuAction(
            items,
            CollectionMenuItemType.Schema,
            SchemaViewerTabDefinition.icon(),
            this.getItemTitle,
            () =>
                this.workspaceService.createTab(
                    this.schemaViewerTabFactory.createNew(
                        new EntitySchemaPointer(
                            catalog.name,
                            entityCollection.entityType
                        )
                    )
                )
        )

        this.createMenuSubheader(
            items,
            CollectionMenuItemType.ModifySubheader,
            this.getItemTitle
        )
        this.createMenuAction(
            items,
            CollectionMenuItemType.RenameCollection,
            'mdi-pencil-outline',
            this.getItemTitle,
            () => renameCollectionCallback(),
            serverWritable
        )
        this.createMenuAction(
            items,
            CollectionMenuItemType.DeleteCollection,
            'mdi-delete-outline',
            this.getItemTitle,
            () => deleteCollectionCallback(),
            serverWritable
        )

        return items
    }

    protected getItemTitle(itemType: CollectionMenuItemType): string {
        return i18n.global.t(`explorer.collection.menu.item.${itemType}`)
    }

}
