<script setup lang="ts" generic="V, R extends Readonly<Record<string, V | undefined>>, C = void">
/**
 * Generic server-paginated data grid with automatic and user-resizable column widths, horizontal scrolling,
 * multi-column sorting, cell selection and an in-place editing hook.
 *
 * The grid holds no data state of its own: rows, pagination, sort, selection and editing state are owned by the
 * parent and passed in one-way. User changes of pagination or sort are emitted as `update:options` only when the
 * user makes them (never on mount or as an echo of a prop change). Rows keep the original cell values; each column
 * prints them through its `printer`, which receives the grid-wide `context`. See
 * `documentation/developer/ui-components.md#data-grid`.
 */

import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DataGridColumn } from '@/modules/base/model/data-grid/DataGridColumn'
import type { DataGridSortItem, DataGridSortOrder } from '@/modules/base/model/data-grid/DataGridSortItem'
import type { DataGridOptions } from '@/modules/base/model/data-grid/DataGridOptions'
import type { DataGridCellPosition } from '@/modules/base/model/data-grid/DataGridCellPosition'
import { printDataGridCell } from '@/modules/base/service/data-grid/dataGridFormat'
import {
    computeAutoColumnWidths,
    dataGridDefaultColumnWidth,
    type TextMeasurer
} from '@/modules/base/service/data-grid/dataGridColumnWidth'
import { useDataGridOptions } from '@/modules/base/composable/data-grid/useDataGridOptions'
import VDataGridColumnHeader from '@/modules/base/component/data-grid/VDataGridColumnHeader.vue'
import VDataGridFooter from '@/modules/base/component/data-grid/VDataGridFooter.vue'

/**
 * Payload of a cell click.
 */
export interface DataGridCellClickEvent<V, R, C = void> {
    row: R
    rowIndex: number
    column: DataGridColumn<V, R, C>
    value: V | undefined
    event: MouseEvent
}

/**
 * Payload of a committed cell edit. The grid never applies it to its rows, the owner does.
 */
export interface DataGridEditCommitEvent<V, R, C = void> {
    row: R
    column: DataGridColumn<V, R, C>
    value: V
}

const { t } = useI18n()

const props = withDefaults(defineProps<{
    columns: DataGridColumn<V, R, C>[],
    rows: R[],
    /**
     * Grid-wide context passed to every column printer and editor (e.g. a display option of the owner). A change
     * re-prints all cells and re-computes the automatic column widths.
     */
    context?: C,
    /**
     * Returns a stable identity of a row, used to keep selection and editing across reloads of the rows.
     */
    rowKey: (row: R, index: number) => string | number,
    totalCount: number,
    /**
     * 1-based page number.
     */
    page: number,
    itemsPerPage: number,
    itemsPerPageOptions?: number[],
    sortBy?: DataGridSortItem[],
    multiSort?: boolean,
    loading?: boolean,
    /**
     * Highlighted cell, its row is highlighted too. Selecting is up to the owner (typically in `click:cell`).
     */
    selectedCell?: DataGridCellPosition,
    /**
     * Cell rendered through the `cell-editor` slot. Only cells of columns with an editor can be edited.
     */
    editingCell?: DataGridCellPosition
}>(), {
    itemsPerPageOptions: () => [10, 25, 50, 100],
    sortBy: () => [],
    multiSort: false,
    loading: false,
    context: undefined,
    selectedCell: undefined,
    editingCell: undefined
})
const emit = defineEmits<{
    (e: 'update:options', value: DataGridOptions): void
    (e: 'update:editingCell', value: DataGridCellPosition | undefined): void
    (e: 'click:cell', value: DataGridCellClickEvent<V, R, C>): void
    (e: 'edit:commit', value: DataGridEditCommitEvent<V, R, C>): void
}>()
defineSlots<{
    cell?(props: {
        row: R,
        rowIndex: number,
        column: DataGridColumn<V, R, C>,
        value: V | undefined,
        text: string,
        selected: boolean
    }): unknown
    'cell-editor'?(props: {
        row: R,
        column: DataGridColumn<V, R, C>,
        value: V | undefined,
        commit: (value: V) => void,
        cancel: () => void
    }): unknown
    'no-data'?(): unknown
}>()

const { pageCount, clampPageToResult, toggleSort, setPage, setItemsPerPage } = useDataGridOptions(
    () => ({
        page: props.page,
        itemsPerPage: props.itemsPerPage,
        sortBy: props.sortBy,
        totalCount: props.totalCount,
        multiSort: props.multiSort
    }),
    options => emit('update:options', options)
)
// checked on every new result, not on a total count change: a restored page beyond a result that fits on one page
// keeps the page count at 1 and would never be clamped otherwise; not immediate, the first result is not known yet
watch(() => props.rows, () => clampPageToResult())

function cellValue(row: R, column: DataGridColumn<V, R, C>): V | undefined {
    return row[column.key]
}

const rowKeys = computed<(string | number)[]>(() => props.rows.map((row, index) => props.rowKey(row, index)))
// printed once per data, column or context change, reused for rendering and for computing the column widths
const formattedCells = computed<string[][]>(() => {
    const context: C = props.context as C
    return props.rows.map(row => props.columns.map(column => printDataGridCell(column, cellValue(row, column), row, context)))
})

const measureElement = ref<HTMLElement>()
const textMeasurer = ref<TextMeasurer>()
const autoColumnWidths = computed<Map<string, number>>(() =>
    computeAutoColumnWidths(props.columns, formattedCells.value, textMeasurer.value))
// widths the user resized columns to, kept for the lifetime of the grid regardless of displayed rows and columns
const manualColumnWidths = reactive<Map<string, number>>(new Map())
const columnWidths = computed<number[]>(() => props.columns.map(column =>
    manualColumnWidths.get(column.key) ?? autoColumnWidths.value.get(column.key) ?? dataGridDefaultColumnWidth))
const tableWidth = computed<number>(() => columnWidths.value.reduce((sum, width) => sum + width, 0))

/**
 * Creates a measurer of the cell text using the cell font. The font is composed from its longhand properties
 * because the computed `font` shorthand is empty in some browsers.
 */
function resolveCellFont(): string | undefined {
    if (measureElement.value == undefined) {
        return undefined
    }
    const style: CSSStyleDeclaration = getComputedStyle(measureElement.value)
    return `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
}

function createTextMeasurer(font: string): TextMeasurer | undefined {
    const context: CanvasRenderingContext2D | null = document.createElement('canvas').getContext('2d')
    if (context == null) {
        return undefined
    }
    context.font = font
    return (text: string) => context.measureText(text).width
}

onMounted(() => {
    const font: string | undefined = resolveCellFont()
    if (font == undefined) {
        return
    }
    textMeasurer.value = createTextMeasurer(font)
    // a web font is downloaded only once it is first used, so the first measurement may use a fallback font;
    // measure again once the cell font is actually available
    document.fonts?.load(font)
        .then(() => textMeasurer.value = createTextMeasurer(font))
        .catch(() => {
            // keep the fallback measurement
        })
})

function sortOrderOf(key: string): DataGridSortOrder | undefined {
    return props.sortBy.find(it => it.key === key)?.order
}

function isSameCell(position: DataGridCellPosition | undefined, rowIndex: number, columnKey: string): boolean {
    return position != undefined && position.rowKey === rowKeys.value[rowIndex] && position.columnKey === columnKey
}

function isSelectedRow(rowIndex: number): boolean {
    return props.selectedCell != undefined && props.selectedCell.rowKey === rowKeys.value[rowIndex]
}

function isEditingCell(rowIndex: number, column: DataGridColumn<V, R, C>): boolean {
    return column.editor != undefined && isSameCell(props.editingCell, rowIndex, column.key)
}

function commitEdit(row: R, column: DataGridColumn<V, R, C>, value: V): void {
    emit('edit:commit', { row, column, value })
    emit('update:editingCell', undefined)
}

function cancelEdit(): void {
    emit('update:editingCell', undefined)
}
</script>

<template>
    <VTable
        density="compact"
        fixed-header
        class="data-grid"
        :style="{ '--data-grid-table-width': `${tableWidth}px` }"
    >
        <colgroup>
            <col
                v-for="(column, columnIndex) in columns"
                :key="column.key"
                :style="{ width: `${columnWidths[columnIndex]}px` }"
            >
            <col>
        </colgroup>
        <thead>
            <tr>
                <VDataGridColumnHeader
                    v-for="(column, columnIndex) in columns"
                    :key="column.key"
                    :column="column"
                    :sort-order="sortOrderOf(column.key)"
                    :width="columnWidths[columnIndex] ?? dataGridDefaultColumnWidth"
                    @toggle-sort="toggleSort(column.key)"
                    @resize="manualColumnWidths.set(column.key, $event)"
                    @reset-width="manualColumnWidths.delete(column.key)"
                />
                <th class="data-grid__filler" />
            </tr>
        </thead>
        <tbody>
            <tr v-if="rows.length === 0 && !loading">
                <td :colspan="columns.length + 1" class="data-grid__no-data">
                    <slot name="no-data">
                        {{ t('common.dataGrid.noData') }}
                    </slot>
                </td>
            </tr>
            <tr
                v-for="(row, rowIndex) in rows"
                :key="rowKeys[rowIndex]"
                :class="{ 'data-grid__row--selected': isSelectedRow(rowIndex) }"
            >
                <td
                    v-for="(column, columnIndex) in columns"
                    :key="column.key"
                    :class="['data-grid__cell', { 'data-grid__cell--selected': isSameCell(selectedCell, rowIndex, column.key) }]"
                    @click="emit('click:cell', { row, rowIndex, column, value: cellValue(row, column), event: $event })"
                >
                    <slot
                        v-if="isEditingCell(rowIndex, column)"
                        name="cell-editor"
                        :row="row"
                        :column="column"
                        :value="cellValue(row, column)"
                        :commit="(value: V) => commitEdit(row, column, value)"
                        :cancel="cancelEdit"
                    />
                    <slot
                        v-else
                        name="cell"
                        :row="row"
                        :row-index="rowIndex"
                        :column="column"
                        :value="cellValue(row, column)"
                        :text="formattedCells[rowIndex]?.[columnIndex] ?? ''"
                        :selected="isSameCell(selectedCell, rowIndex, column.key)"
                    >
                        {{ formattedCells[rowIndex]?.[columnIndex] }}
                    </slot>
                </td>
                <td class="data-grid__filler" />
            </tr>
        </tbody>

        <template #bottom>
            <VProgressLinear
                v-if="loading"
                indeterminate
                class="data-grid__progress"
            />
            <span ref="measureElement" class="data-grid__measure" aria-hidden="true" />
            <VDataGridFooter
                :page="page"
                :page-count="pageCount"
                :items-per-page="itemsPerPage"
                :items-per-page-options="itemsPerPageOptions"
                :total-count="totalCount"
                @update:page="setPage"
                @update:items-per-page="setItemsPerPage"
            />
        </template>
    </VTable>
</template>

<style lang="scss" scoped>
.data-grid {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: 0;

    & :deep(> .v-table__wrapper) {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
    }

    & :deep(> .v-table__wrapper > table) {
        table-layout: fixed;
        // columns keep their exact widths, the trailing filler column absorbs any leftover space
        width: var(--data-grid-table-width);
        min-width: 100%;
    }

    & :deep(> .v-table__wrapper > table > thead > tr > th),
    & :deep(> .v-table__wrapper > table > tbody > tr > td) {
        padding: 0 12px;
    }

    // the grid fills its whole pane, so unlike a table embedded in a page it closes its bottom edge
    & :deep(> .v-table__wrapper > table > tbody > tr:last-child > td) {
        border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
    }

    &__cell {
        height: 2.25rem;
        line-height: 2.25rem;
        position: relative;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &__row--selected > td {
        background-color: rgba(var(--v-theme-on-surface), 0.04);
    }

    // declared after the row highlight and with the row in the selector, so it wins over it
    &__row--selected > &__cell--selected {
        background-color: rgba(var(--v-theme-primary-lightest), 0.12);
        box-shadow: inset 0 0 0 1px rgb(var(--v-theme-primary-lightest));
    }

    &__no-data {
        text-align: center;
    }

    &__progress {
        position: absolute;
        top: var(--v-table-header-height);
        left: 0;
        right: 0;
        z-index: 3;
    }

    &__measure {
        position: absolute;
        visibility: hidden;
        pointer-events: none;
        white-space: nowrap;
    }
}
</style>
