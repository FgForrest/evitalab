<script setup lang="ts">
/**
 * Grid with actual data for the LabEditorDataGrid component.
 */

import { Pane, Splitpanes } from 'splitpanes'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { EntityViewerService, useEntityViewerService } from '@/modules/entity-viewer/viewer/service/EntityViewerService'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { FlatEntity } from '@/modules/entity-viewer/viewer/model/FlatEntity'
import { QueryLanguage } from '@/modules/entity-viewer/viewer/model/QueryLanguage'
import { EntityPropertyDescriptor } from '@/modules/entity-viewer/viewer/model/EntityPropertyDescriptor'
import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { EntityPropertyType } from '@/modules/entity-viewer/viewer/model/EntityPropertyType'
import { StaticEntityProperties } from '@/modules/entity-viewer/viewer/model/StaticEntityProperties'
import {
    EntityViewerTabFactory,
    useEntityViewerTabFactory
} from '@/modules/entity-viewer/viewer/workspace/service/EntityViewerTabFactory'
import { EntityViewerTabData } from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabData'
import { EntityReferenceValue } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceValue'
import { Scalar } from '@/modules/connection/model/data-type/Scalar'
import { NativeValue } from '@/modules/entity-viewer/viewer/model/entity-property-value/NativeValue'
import EntityGridColumnHeader from '@/modules/entity-viewer/viewer/component/entity-grid/EntityGridColumnHeader.vue'
import EntityGridCell from '@/modules/entity-viewer/viewer/component/entity-grid/EntityGridCell.vue'
import EntityGridCellDetail from '@/modules/entity-viewer/viewer/component/entity-grid/EntityGridCellDetail.vue'
import {
    useDataLocale,
    useEntityPropertyDescriptorIndex,
    useQueryLanguage,
    useTabProps
} from '@/modules/entity-viewer/viewer/component/dependencies'
import { AttributeSchema } from '@/modules/connection/model/schema/AttributeSchema'
import { ReferenceSchema } from '@/modules/connection/model/schema/ReferenceSchema'

const workspaceService: WorkspaceService = useWorkspaceService()
const entityViewerService: EntityViewerService = useEntityViewerService()
const entityViewerTabFactory: EntityViewerTabFactory = useEntityViewerTabFactory()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const pageSizeOptions: any[] = [10, 25, 50, 100, 250, 500, 1000].map(it => ({ title: it.toString(10), value: it }))

const props = defineProps<{
    displayedGridHeaders: any[],
    loading: boolean,
    resultEntities: FlatEntity[],
    totalResultCount: number,
    pageNumber: number,
    pageSize: number
}>()
const emit = defineEmits<{
    (e: 'gridUpdated', value: { page: number, itemsPerPage: number, sortBy: any[] }): void
}>()
const tabProps = useTabProps()
const entityPropertyDescriptorIndex = useEntityPropertyDescriptorIndex()
const queryLanguage = useQueryLanguage()
const dataLocale = useDataLocale()

const showPropertyDetail = ref<boolean>(false)
const propertyDetailEntity = ref<FlatEntity | undefined>()
const propertyDetailDescriptor = ref<EntityPropertyDescriptor | undefined>()
const propertyDetailValue = ref<EntityPropertyValue | EntityPropertyValue[] | undefined>()

function getPropertyDescriptor(key: string): EntityPropertyDescriptor | undefined {
    const descriptor = entityPropertyDescriptorIndex.value.get(key)
    if (descriptor == undefined) {
        toaster.error(new UnexpectedError(t('entityViewer.grid.notification.failedToFindProperty', { key })))
    }
    return descriptor
}

function handlePropertyClicked(relativeEntityIndex: number, propertyKey: string, value: EntityPropertyValue | EntityPropertyValue[]): void {
    if (value == undefined || (value instanceof EntityPropertyValue && value.value() == undefined)) {
        return
    }
    const propertyDescriptor: EntityPropertyDescriptor | undefined = getPropertyDescriptor(propertyKey)
    if (value instanceof Array && value.length === 0) {
        // do nothing with empty value
        return
    } else if (propertyDescriptor &&
        propertyDescriptor.type === EntityPropertyType.Entity &&
        propertyDescriptor.key.name === StaticEntityProperties.ParentPrimaryKey) {
        // we want to open parent entity in appropriate new grid
        workspaceService.createTab(entityViewerTabFactory.createNew(
            tabProps.params.dataPointer.connection,
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
        ((propertyDescriptor.type === EntityPropertyType.Attributes && (propertyDescriptor.schema as AttributeSchema).type.getIfSupported()! === Scalar.Predecessor) ||
        (propertyDescriptor.type === EntityPropertyType.AssociatedData && (propertyDescriptor.schema as AttributeSchema).type.getIfSupported()! === Scalar.Predecessor))) {
        // we want references to open referenced entities in appropriate new grid for referenced collection
        workspaceService.createTab(entityViewerTabFactory.createNew(
            tabProps.params.dataPointer.connection,
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
    } else if (propertyDescriptor && propertyDescriptor.type === EntityPropertyType.References) {
        // we want references to open referenced entities in appropriate new grid for referenced collection
        workspaceService.createTab(entityViewerTabFactory.createNew(
            tabProps.params.dataPointer.connection,
            tabProps.params.dataPointer.catalogName,
            (propertyDescriptor.schema as ReferenceSchema).entityType.getIfSupported()!,
            new EntityViewerTabData(
                queryLanguage.value,
                entityViewerService.buildReferencedEntityFilterBy(
                    queryLanguage.value as QueryLanguage,
                    value instanceof Array
                        ? (value as EntityReferenceValue[]).map(it => it.primaryKey)
                        : [(value as EntityReferenceValue).primaryKey]
                ),
                undefined,
                dataLocale?.value
            ),
            true
        ))
    } else {
        // for other values, show detail of the value
        propertyDetailEntity.value = props.resultEntities[relativeEntityIndex]
        propertyDetailDescriptor.value = propertyDescriptor
        propertyDetailValue.value = value
        showPropertyDetail.value = true
    }
}

function closePropertyDetail(): void {
    showPropertyDetail.value = false
    propertyDetailEntity.value = undefined
    propertyDetailDescriptor.value = undefined
    propertyDetailValue.value = undefined
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
            <VDataTableServer
                :headers="displayedGridHeaders"
                :loading="loading"
                :items="resultEntities"
                :items-length="totalResultCount"
                density="compact"
                fixed-header
                fixed-footer
                multi-sort
                :items-per-page="pageSize"
                :items-per-page-Options="pageSizeOptions"
                @update:options="emit('gridUpdated', $event)"
                class="data-grid__grid"
            >
                <template #headers="{ columns, isSorted, getSortIcon, toggleSort }">
                    <tr>
                        <EntityGridColumnHeader
                            v-for="column in columns"
                            :key="column.key!"
                            :column="column"
                            :is-sorted="isSorted"
                            :get-sort-icon="getSortIcon"
                            :toggle-sort="toggleSort"
                        />
                    </tr>
                </template>
                <template #item="{ internalItem, index }">
                    <tr>
                        <EntityGridCell
                            v-for="(propertyValue, propertyKey) in internalItem.columns"
                            :key="propertyKey"
                            :property-descriptor="entityPropertyDescriptorIndex.get(propertyKey as string)"
                            :property-value="propertyValue"
                            @click="handlePropertyClicked(index, propertyKey as string, propertyValue)"
                        />
                    </tr>
                </template>
            </VDataTableServer>
        </Pane>
        <Pane
            v-if="showPropertyDetail"
            size="30"
            min-size="30"
        >
            <EntityGridCellDetail
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
.data-grid__body {
    // we need to force table to be stretched to a window borders
    & :deep(.v-table) {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: 1fr;
        overflow-x: auto;
    }
}

.data-grid__grid {
    & :deep(th[class^="data-grid-column-header"]) {
        border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
    }

    & :deep(td) {
        border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
        border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
    }
}

.data-grid-cell__body {
    line-height: 2.25rem;
    overflow-x: hidden;
    overflow-y: hidden;
    display: block;
    min-width: 5rem;
    max-width: 15rem;
    height: 2.25rem;
    text-overflow: clip;
    text-wrap: nowrap;
}
</style>
