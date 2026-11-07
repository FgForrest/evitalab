
<script setup lang="ts">
/**
 * Grid with the entities of the current query result and the detail sidepanel of the selected cell.
 */

import { Pane, Splitpanes } from 'splitpanes'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { EntityViewerService, useEntityViewerService } from '@/modules/entity-viewer/viewer/service/EntityViewerService'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import type { FlatEntity } from '@/modules/entity-viewer/viewer/model/FlatEntity'
import { QueryLanguage } from '@/modules/entity-viewer/viewer/model/QueryLanguage'
import { EntityPropertyDescriptor } from '@/modules/entity-viewer/viewer/model/EntityPropertyDescriptor'
import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import { EntityPropertyType } from '@/modules/entity-viewer/viewer/model/EntityPropertyType'
import { StaticEntityProperties } from '@/modules/entity-viewer/viewer/model/StaticEntityProperties'
import {
    EntityViewerTabFactory,
    useEntityViewerTabFactory
} from '@/modules/entity-viewer/viewer/workspace/service/EntityViewerTabFactory'
import { EntityViewerTabData } from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabData'
import { EntityReferenceValue } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceValue'
import { EntityReferences } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferences'
import {
    EntityReferenceAttributes
} from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceAttributes'
import { NativeValue } from '@/modules/entity-viewer/viewer/model/entity-property-value/NativeValue'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import type { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope'
import EntityGridCell from '@/modules/entity-viewer/viewer/component/entity-grid/EntityGridCell.vue'
import EntityGridCellDetail from '@/modules/entity-viewer/viewer/component/entity-grid/EntityGridCellDetail.vue'
import {
    useDataLocale,
    useEntityPropertyDescriptors,
    usePriceType,
    useQueryLanguage,
    useTabProps
} from '@/modules/entity-viewer/viewer/component/dependencies'
import { AttributeSchema } from '@/modules/database-driver/request-response/schema/AttributeSchema'
import { Scalar } from '@/modules/database-driver/data-type/Scalar'
import type { Predecessor } from '@/modules/database-driver/data-type/Predecessor.ts'
import { isTypedSchema } from '@/modules/database-driver/request-response/schema/TypedSchema'
import VDataGrid from '@/modules/base/component/data-grid/VDataGrid.vue'
import type { DataGridColumn } from '@/modules/base/model/data-grid/DataGridColumn'
import type { DataGridOptions } from '@/modules/base/model/data-grid/DataGridOptions'
import type { DataGridSortItem } from '@/modules/base/model/data-grid/DataGridSortItem'
import type { DataGridCellPosition } from '@/modules/base/model/data-grid/DataGridCellPosition'
import type {
    EntityViewerPrintContext
} from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityViewerPrintContext'
import {
    type EntityGridValue,
    EntityPropertyValuePrinter,
    useEntityPropertyValuePrinter
} from '@/modules/entity-viewer/viewer/service/EntityPropertyValuePrinter'

const workspaceService: WorkspaceService = useWorkspaceService()
const entityViewerService: EntityViewerService = useEntityViewerService()
const entityViewerTabFactory: EntityViewerTabFactory = useEntityViewerTabFactory()
const toaster: Toaster = useToaster()
const entityPropertyValuePrinter: EntityPropertyValuePrinter = useEntityPropertyValuePrinter()
const { t } = useI18n()

const pageSizeOptions: number[] = [10, 25, 50, 100, 250, 500, 1000]
/**
 * Width of the icon {@link EntityGridCell} prepends to some values (24px icon + `mr-1`).
 */
const cellIconWidth: number = 28

const props = defineProps<{
    /**
     * Properties shown as columns, in column order.
     */
    selectedEntityProperties: EntityPropertyKey[],
    /**
     * Scopes the query is executed in; a column is sortable only if its property is sortable in all of them.
     */
    activeScopes: EntityScope[],
    loading: boolean,
    resultEntities: FlatEntity[],
    totalResultCount: number,
    pageNumber: number,
    pageSize: number,
    /**
     * Grid sort state owned by the parent. The grid emits a changed sort only when the user clicks a column header,
     * so the parent can tell user sorts apart from its own programmatic changes.
     */
    sortBy: DataGridSortItem[]
}>()
const emit = defineEmits<{
    (e: "gridUpdated", value: DataGridOptions): void
}>()
const tabProps = useTabProps()
const entityPropertyDescriptors = useEntityPropertyDescriptors()
const queryLanguage = useQueryLanguage()
const dataLocale = useDataLocale()
const priceType = usePriceType()

// a computed keeps the same context object between unrelated renders, a changed price type re-prints the cells
const printContext = computed<EntityViewerPrintContext>(() => ({ priceType: priceType.value }))
const columns = computed<DataGridColumn<EntityGridValue, FlatEntity, EntityViewerPrintContext>[]>(() => props.selectedEntityProperties
    .map(key => entityPropertyDescriptors.value.get(key))
    .filter((descriptor): descriptor is EntityPropertyDescriptor => descriptor != undefined)
    .map(descriptor => ({
        key: descriptor.key.toString(),
        title: descriptor.flattenedTitle,
        sortable: descriptor.isSortable(props.activeScopes),
        prependIcons: resolveHeaderIcon(descriptor),
        appendIcons: descriptor.isLocalized() ? ['mdi-translate'] : undefined,
        printer: entityPropertyValuePrinter.forColumn(descriptor),
        cellIconWidth: hasCellIcon(descriptor) ? cellIconWidth : undefined
    })))

function resolveHeaderIcon(descriptor: EntityPropertyDescriptor): string[] | undefined {
    if (descriptor.type === EntityPropertyType.AssociatedData) {
        return ['mdi-package-variant-closed']
    }
    if (descriptor.type === EntityPropertyType.References || descriptor.type === EntityPropertyType.ReferenceAttributes) {
        return ['mdi-link-variant']
    }
    return undefined
}

/**
 * Whether {@link EntityGridCell} prepends an icon to values of the property.
 */
function hasCellIcon(descriptor: EntityPropertyDescriptor): boolean {
    return (descriptor.type === EntityPropertyType.Entity && descriptor.key.name === StaticEntityProperties.ParentPrimaryKey) ||
        descriptor.type === EntityPropertyType.References ||
        (descriptor.schema != undefined && isTypedSchema(descriptor.schema) && descriptor.schema.type === Scalar.Predecessor)
}

function entityPrimaryKey(entity: FlatEntity): number {
    return (entity[StaticEntityProperties.PrimaryKey] as NativeValue).value() as number
}

const showPropertyDetail = ref<boolean>(false)
const propertyDetailEntity = ref<FlatEntity | undefined>()
const propertyDetailDescriptor = ref<EntityPropertyDescriptor | undefined>()
const propertyDetailValue = ref<EntityPropertyValue | EntityPropertyValue[] | undefined>()
const selectedCell = ref<DataGridCellPosition | undefined>()
// bumped whenever the detailed entity is replaced by its re-queried version
const propertyDetailRevision = ref<number>(0)
// identity of the currently detailed cell; used to force the detail component to remount when switching cells (or
// refreshing the entity) so its non-reactive `provide`d entity/descriptor are refreshed instead of going stale
const propertyDetailKey = computed<string | undefined>(() =>
    selectedCell.value != undefined
        ? `${selectedCell.value.rowKey}-${selectedCell.value.columnKey}-${propertyDetailRevision.value}`
        : undefined)

// a re-query replaces the entities; keep showing the detailed entity if it is still on the page (with its fresh data),
// otherwise close the detail so that the sidepanel and the highlighted cell never show different data
watch(() => props.resultEntities, (entities) => {
    if (selectedCell.value == undefined) {
        return
    }
    const position: DataGridCellPosition = selectedCell.value
    const entity: FlatEntity | undefined = entities.find(it => entityPrimaryKey(it) === position.rowKey)
    const value: EntityGridValue | undefined = entity?.[position.columnKey]
    if (entity == undefined || value == undefined) {
        closePropertyDetail()
        return
    }
    propertyDetailEntity.value = entity
    propertyDetailValue.value = value
    propertyDetailRevision.value++
})

function getPropertyDescriptor(key: string): EntityPropertyDescriptor | undefined {
    const descriptor = entityPropertyDescriptors.value.get(key)
    if (descriptor == undefined) {
        toaster.error(t('entityViewer.grid.notification.failedToFindProperty', { key }))
            .then()
    }
    return descriptor
}

function handlePropertyClicked(entity: FlatEntity, propertyKey: string, value: EntityGridValue | undefined): void {
    // a click also ends a text selection dragged within the cell, which must not open or navigate anything
    if (window.getSelection()?.isCollapsed === false) {
        return
    }
    if (value == undefined || (value instanceof EntityPropertyValue && value.value() == undefined)  || (value instanceof EntityPropertyValue && (value.value() as Predecessor).predecessorId === -1)) {
        return
    }
    const propertyDescriptor: EntityPropertyDescriptor | undefined = getPropertyDescriptor(propertyKey)
    if (value instanceof Array && value.length === 0) {
        // do nothing with empty value
        return
    } else if ((value instanceof EntityReferences || value instanceof EntityReferenceAttributes) && value.count() === 0) {
        // no references to show, keep the empty cell non-interactive
        return
    } else if (propertyDescriptor &&
        propertyDescriptor.type === EntityPropertyType.Entity &&
        propertyDescriptor.key.name === StaticEntityProperties.ParentPrimaryKey) {
        // we want to open parent entity in appropriate new grid
        workspaceService.createTab(entityViewerTabFactory.createNew(
            tabProps.params.dataPointer.catalogName,
            tabProps.params.dataPointer.entityType,
            new EntityViewerTabData(
                queryLanguage?.value,
                entityViewerService.buildParentEntityFilterBy(queryLanguage.value as QueryLanguage, (value as EntityReferenceValue).primaryKey),
                undefined,
                dataLocale?.value
            ),
            true
        ))
    } else if (propertyDescriptor &&
        ((propertyDescriptor.type === EntityPropertyType.Attributes && (propertyDescriptor.schema as AttributeSchema).type === Scalar.Predecessor) ||
        (propertyDescriptor.type === EntityPropertyType.AssociatedData && (propertyDescriptor.schema as AttributeSchema).type === Scalar.Predecessor))) {
        // we want references to open referenced entities in appropriate new grid for referenced collection
        workspaceService.createTab(entityViewerTabFactory.createNew(
            tabProps.params.dataPointer.catalogName,
            tabProps.params.dataPointer.entityType,
            new EntityViewerTabData(
                queryLanguage.value,
                entityViewerService.buildPredecessorEntityFilterBy(queryLanguage.value as QueryLanguage, (value as NativeValue).value() as number),
                undefined,
                dataLocale?.value
            ),
            true
        ))
    } else {
        // for other values (incl. references and reference attributes), show detail of the value in the sidepanel
        propertyDetailEntity.value = entity
        propertyDetailDescriptor.value = propertyDescriptor
        propertyDetailValue.value = value
        selectedCell.value = { rowKey: entityPrimaryKey(entity), columnKey: propertyKey }
        showPropertyDetail.value = true
    }
}

function closePropertyDetail(): void {
    showPropertyDetail.value = false
    propertyDetailEntity.value = undefined
    propertyDetailDescriptor.value = undefined
    propertyDetailValue.value = undefined
    selectedCell.value = undefined
}
</script>

<template>
    <Splitpanes
        vertical
        class="data-grid__body"
    >
        <Pane
            size="70"
            min-size="30"
        >
            <VDataGrid
                class="data-grid__grid"
                :columns="columns"
                :context="printContext"
                :rows="resultEntities"
                :row-key="entityPrimaryKey"
                :total-count="totalResultCount"
                :page="pageNumber"
                :items-per-page="pageSize"
                :items-per-page-options="pageSizeOptions"
                :sort-by="sortBy"
                multi-sort
                :loading="loading"
                :selected-cell="selectedCell"
                @update:options="emit('gridUpdated', $event)"
                @click:cell="handlePropertyClicked($event.row, $event.column.key, $event.value)"
            >
                <template #cell="{ row, column, value, text }">
                    <EntityGridCell
                        :entity-primary-key="entityPrimaryKey(row)"
                        :property-descriptor="entityPropertyDescriptors.get(column.key)"
                        :property-value="value"
                        :printable-value="text"
                    />
                </template>
            </VDataGrid>
        </Pane>
        <Pane
            v-if="showPropertyDetail"
            size="30"
            min-size="30"
        >
            <EntityGridCellDetail
                :key="propertyDetailKey"
                :model-value="showPropertyDetail"
                :entity="propertyDetailEntity!"
                :property-descriptor="propertyDetailDescriptor"
                :property-value="propertyDetailValue"
                @update:model-value="closePropertyDetail"
            />
        </Pane>
    </Splitpanes>
</template>

<style lang="scss" scoped>
// the pane grows with its content, so the grid is stretched over the pane instead of sized by it
.data-grid__grid {
    position: absolute;
    inset: 0;
    height: auto;
}
</style>
