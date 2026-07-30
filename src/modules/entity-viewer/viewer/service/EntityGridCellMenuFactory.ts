import type { InjectionKey } from 'vue'
import { MenuFactory } from '@/modules/base/service/menu/MenuFactory'
import type { MenuItem } from '@/modules/base/model/menu/MenuItem'
import {
    EntityGridCellMenuItemType
} from '@/modules/entity-viewer/viewer/model/entity-grid/EntityGridCellMenuItemType'
import { EntityPropertyDescriptor } from '@/modules/entity-viewer/viewer/model/EntityPropertyDescriptor'
import type {
    PropertyMutationHistoryContainer
} from '@/modules/entity-viewer/viewer/model/entity-grid/propertyMutationHistoryContainer'
import {
    resolvePropertyMutationHistoryContainer
} from '@/modules/entity-viewer/viewer/model/entity-grid/propertyMutationHistoryContainer'
import { WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { MutationHistoryViewerTabData } from '@/modules/history-viewer/model/MutationHistoryViewerTabData'
import { GrpcChangeCaptureContainerType } from '@/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb'
import { i18n } from '@/vue-plugins/i18n'
import { mandatoryInject } from '@/utils/reactivity'

export const entityGridCellMenuFactoryInjectionKey: InjectionKey<EntityGridCellMenuFactory> = Symbol('entityGridCellMenuFactoryInjectionKey')

export function useEntityGridCellMenuFactory(): EntityGridCellMenuFactory {
    return mandatoryInject(entityGridCellMenuFactoryInjectionKey)
}

/**
 * Creates menus for single entity grid cells and opens the mutation history a cell points at. The history
 * actions are public on their own, so surfaces that offer a single direct action instead of a menu (the
 * cell detail header) can reuse the very same resolution logic.
 */
export class EntityGridCellMenuFactory extends MenuFactory<EntityGridCellMenuItemType> {

    private readonly workspaceService: WorkspaceService

    constructor(workspaceService: WorkspaceService) {
        super()
        this.workspaceService = workspaceService
    }

    /**
     * Creates menu items supported by a single entity grid cell. Actions that the cell's property does not
     * support are not created at all, so that a cell menu lists only what it can actually do.
     *
     * @param catalogName name of the catalog the entity is stored in
     * @param entityType type of the entity the cell belongs to
     * @param entityPrimaryKey primary key of the entity the cell belongs to
     * @param propertyDescriptor descriptor of the property rendered by the cell
     * @param copyValueCallback copies the printable cell value
     * @param copyRawValueCallback copies the raw cell value
     */
    async createItems(
        catalogName?: string,
        entityType?: string,
        entityPrimaryKey?: number,
        propertyDescriptor?: EntityPropertyDescriptor,
        copyValueCallback?: () => void,
        copyRawValueCallback?: () => void
    ): Promise<Map<EntityGridCellMenuItemType, MenuItem<EntityGridCellMenuItemType>>> {
        if (catalogName == undefined) throw new Error('catalogName is not defined!')
        if (entityType == undefined) throw new Error('entityType is not defined!')
        if (entityPrimaryKey == undefined) throw new Error('entityPrimaryKey is not defined!')
        if (copyValueCallback == undefined) throw new Error('Missing copyValueCallback')
        if (copyRawValueCallback == undefined) throw new Error('Missing copyRawValueCallback')

        const items: Map<EntityGridCellMenuItemType, MenuItem<EntityGridCellMenuItemType>> = new Map()

        this.createMenuAction(
            items,
            EntityGridCellMenuItemType.CopyValue,
            'mdi-content-copy',
            () => i18n.global.t('entityViewer.grid.cell.menu.copyValue'),
            () => copyValueCallback()
        )
        this.createMenuAction(
            items,
            EntityGridCellMenuItemType.CopyRawValue,
            'mdi-content-copy',
            () => i18n.global.t('entityViewer.grid.cell.menu.copyRawValue'),
            () => copyRawValueCallback()
        )

        const propertyHistoryTitle: string | undefined = this.resolvePropertyHistoryTitle(propertyDescriptor)
        if (propertyHistoryTitle != undefined) {
            this.createMenuAction(
                items,
                EntityGridCellMenuItemType.OpenPropertyHistory,
                'mdi-history',
                () => propertyHistoryTitle,
                () => this.openPropertyMutationHistory(catalogName, entityType, entityPrimaryKey, propertyDescriptor)
            )
        }
        this.createMenuAction(
            items,
            EntityGridCellMenuItemType.OpenEntityHistory,
            'mdi-history',
            () => i18n.global.t('entityViewer.grid.cell.menu.entityHistory'),
            () => this.openEntityMutationHistory(catalogName, entityType, entityPrimaryKey)
        )

        return items
    }

    /**
     * Returns the human-readable name of the mutation history target of a given property, or `undefined`
     * when the property has no property-level container and only the entity history is available.
     *
     * @param propertyDescriptor descriptor of the property to resolve the history title for
     */
    resolvePropertyHistoryTitle(propertyDescriptor: EntityPropertyDescriptor | undefined): string | undefined {
        const container: PropertyMutationHistoryContainer | undefined =
            resolvePropertyMutationHistoryContainer(propertyDescriptor)
        if (container == undefined) {
            return undefined
        }
        return i18n.global.t(container.titleKey)
    }

    /**
     * Opens a new mutation history tab narrowed down to the container of a given property of a single entity.
     * Does nothing for properties without a property-level container.
     *
     * @param catalogName name of the catalog the entity is stored in
     * @param entityType type of the entity
     * @param entityPrimaryKey primary key of the entity
     * @param propertyDescriptor descriptor of the property to open the history for
     */
    openPropertyMutationHistory(
        catalogName: string,
        entityType: string,
        entityPrimaryKey: number,
        propertyDescriptor: EntityPropertyDescriptor | undefined
    ): void {
        const container: PropertyMutationHistoryContainer | undefined =
            resolvePropertyMutationHistoryContainer(propertyDescriptor)
        if (container == undefined) {
            return
        }

        this.openMutationHistory(
            catalogName,
            entityType,
            entityPrimaryKey,
            [container.containerType],
            container.containerName != undefined ? [container.containerName] : undefined
        )
    }

    /**
     * Opens a new mutation history tab narrowed down to the entity container of a single entity.
     *
     * @param catalogName name of the catalog the entity is stored in
     * @param entityType type of the entity
     * @param entityPrimaryKey primary key of the entity
     */
    openEntityMutationHistory(catalogName: string, entityType: string, entityPrimaryKey: number): void {
        this.openMutationHistory(
            catalogName,
            entityType,
            entityPrimaryKey,
            [GrpcChangeCaptureContainerType.CONTAINER_ENTITY],
            undefined
        )
    }

    /**
     * Opens a new mutation history tab with an immutable filter of a single entity.
     *
     * @private
     */
    private openMutationHistory(
        catalogName: string,
        entityType: string,
        entityPrimaryKey: number,
        containerTypeList: GrpcChangeCaptureContainerType[],
        containerNameList: string[] | undefined
    ): void {
        this.workspaceService.createTab(
            this.workspaceService.mutationHistoryViewerTabFactory.createNew(
                catalogName,
                new MutationHistoryViewerTabData(
                    undefined,
                    undefined,
                    entityPrimaryKey,
                    undefined,
                    containerNameList,
                    containerTypeList,
                    entityType,
                    'dataSite',
                    false
                )
            )
        )
    }
}
