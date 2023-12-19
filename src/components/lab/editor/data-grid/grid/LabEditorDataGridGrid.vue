<script setup lang="ts">
/**
 * Grid with actual data for the LabEditorDataGrid component.
 */

import { Pane, Splitpanes } from 'splitpanes'
import { VDataTableServer } from 'vuetify/labs/VDataTable'
import LabEditorDataGridGridCellDetail from './LabEditorDataGridGridCellDetail.vue'
import { ref } from 'vue'
import LabEditorDataGridGridCell from '@/components/lab/editor/data-grid/grid/LabEditorDataGridGridCell.vue'
import {
    DataGridConsoleData,
    DataGridConsoleParams,
    EntityPropertyDescriptor,
    EntityPropertyType, EntityReferenceValue,
    StaticEntityProperties
} from '@/model/editor/data-grid'
import { Toaster, useToaster } from '@/services/editor/toaster'
import { QueryLanguage, UnexpectedError } from '@/model/lab'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import { DataGridRequest } from '@/model/editor/data-grid-request'
import { TabComponentProps } from '@/model/editor/editor'
import { DataGridService, useDataGridService } from '@/services/editor/data-grid.service'
import LabEditorDataGridGridColumnHeader
    from '@/components/lab/editor/data-grid/grid/LabEditorDataGridGridColumnHeader.vue'
import { Scalar } from '@/model/evitadb'

const editorService: EditorService = useEditorService()
const dataGridService: DataGridService = useDataGridService()
const toaster: Toaster = useToaster()

const pageSizeOptions: any[] = [10, 25, 50, 100, 250, 500, 1000].map(it => ({ title: it.toString(10), value: it }))

const props = defineProps<{
    gridProps: TabComponentProps<DataGridConsoleParams, DataGridConsoleData>,
    entityPropertyDescriptorIndex: Map<String, EntityPropertyDescriptor>,
    dataLocale: string | undefined,
    queryLanguage: QueryLanguage,
    displayedGridHeaders: any[],
    loading: boolean,
    resultEntities: any[],
    totalResultCount: number,
    pageNumber: number,
    pageSize: number
}>()
const emit = defineEmits<{
    (e: 'gridUpdated', value: { page: number, itemsPerPage: number, sortBy: any[] }): void
}>()


const showPropertyDetail = ref<boolean>(false)
const propertyDetailDescriptor = ref<EntityPropertyDescriptor | undefined>()
const propertyDetailValue = ref<any>()

function getPropertyDescriptor(key: string): EntityPropertyDescriptor | undefined {
    const descriptor = props.entityPropertyDescriptorIndex.get(key)
    if (descriptor == undefined) {
        toaster.error(new UnexpectedError(props.gridProps.params.dataPointer.connection, 'Failed to find property descriptor for key: ' + key))
    }
    return descriptor
}

function handlePropertyClicked(propertyKey: string, value: any): void {
    if (!value) {
        return
    }
    const propertyDescriptor: EntityPropertyDescriptor | undefined = getPropertyDescriptor(propertyKey)
    if (!value || (value instanceof Array && value.length === 0)){
        // do nothing with empty value
        return
    } else if (propertyDescriptor &&
        propertyDescriptor.type === EntityPropertyType.Entity &&
        propertyDescriptor.key.name === StaticEntityProperties.ParentPrimaryKey) {
        // we want to open parent entity in appropriate new grid
        editorService.createTabRequest(new DataGridRequest(
            props.gridProps.params.dataPointer.connection,
            props.gridProps.params.dataPointer.catalogName,
            props.gridProps.params.dataPointer.entityType,
            {
                dataLocale: props.dataLocale,
                queryLanguage: props.queryLanguage,
                pageNumber: props.pageNumber,
                pageSize: props.pageSize,
                filterBy: dataGridService.buildParentEntityFilterBy(props.queryLanguage, (value as EntityReferenceValue).primaryKey)
            },
            true
        ))
    } else if (propertyDescriptor &&
        ((propertyDescriptor.type === EntityPropertyType.Attributes && propertyDescriptor.schema.type === Scalar.Predecessor) ||
        (propertyDescriptor.type === EntityPropertyType.AssociatedData && propertyDescriptor.schema.type === Scalar.Predecessor))) {
        // we want references to open referenced entities in appropriate new grid for referenced collection
        editorService.createTabRequest(new DataGridRequest(
            props.gridProps.params.dataPointer.connection,
            props.gridProps.params.dataPointer.catalogName,
            props.gridProps.params.dataPointer.entityType,
            {
                dataLocale: props.dataLocale,
                queryLanguage: props.queryLanguage,
                pageNumber: props.pageNumber,
                pageSize: props.pageSize,
                filterBy: dataGridService.buildPredecessorEntityFilterBy(props.queryLanguage, value)
            },
            true
        ))
    } else if (propertyDescriptor && propertyDescriptor.type === EntityPropertyType.References) {
        // we want references to open referenced entities in appropriate new grid for referenced collection
        editorService.createTabRequest(new DataGridRequest(
            props.gridProps.params.dataPointer.connection,
            props.gridProps.params.dataPointer.catalogName,
            propertyDescriptor.schema.referencedEntityType,
            {
                dataLocale: props.dataLocale,
                queryLanguage: props.queryLanguage,
                pageNumber: props.pageNumber,
                pageSize: props.pageSize,
                filterBy: dataGridService.buildReferencedEntityFilterBy(
                    props.queryLanguage,
                    value instanceof Array
                        ? (value as EntityReferenceValue[]).map(it => it.primaryKey)
                        : [(value as EntityReferenceValue).primaryKey]
                )
            },
            true
        ))
    } else {
        // for other values, show detail of the value
        propertyDetailDescriptor.value = propertyDescriptor
        propertyDetailValue.value = value
        showPropertyDetail.value = true
    }
}

function closePropertyDetail(): void {
    showPropertyDetail.value = false
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
            >
                <template #headers="{ columns, isSorted, getSortIcon, toggleSort }">
                    <tr>
                        <LabEditorDataGridGridColumnHeader
                            v-for="column in columns"
                            :key="column.key"
                            :column="column"
                            :is-sorted="isSorted"
                            :get-sort-icon="getSortIcon"
                            :toggle-sort="toggleSort"
                        />
                    </tr>
                </template>
                <template #item="{ item }">
                    <tr>
                        <LabEditorDataGridGridCell
                            v-for="(propertyValue, propertyKey) in item.columns"
                            :key="propertyKey"
                            :property-descriptor="entityPropertyDescriptorIndex.get(propertyKey as string)"
                            :data-locale="dataLocale"
                            :property-value="propertyValue"
                            @click="handlePropertyClicked(propertyKey as string, propertyValue)"
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
            <LabEditorDataGridGridCellDetail
                :model-value="showPropertyDetail"
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

    & :deep(th) {
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
