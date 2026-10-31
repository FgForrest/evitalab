import { computed, type ComputedRef } from 'vue'
import type { DataGridOptions } from '@/modules/base/model/data-grid/DataGridOptions'
import type { DataGridSortItem } from '@/modules/base/model/data-grid/DataGridSortItem'
import { toggleSort } from '@/modules/base/service/data-grid/dataGridSort'
import { clampPage, computePageCount } from '@/modules/base/service/data-grid/dataGridPagination'

/**
 * Current pagination and sort state of a data grid, owned by the grid's owner and read one-way by the grid.
 */
export interface DataGridOptionsSource {
    page: number
    itemsPerPage: number
    sortBy: readonly DataGridSortItem[]
    totalCount: number
    multiSort: boolean
}

/**
 * Actions of a data grid that change its pagination or sort state.
 */
export interface DataGridOptionsActions {
    pageCount: ComputedRef<number>
    /**
     * Emits the last existing page if the current page lies beyond it. To be called whenever a new result arrives.
     */
    clampPageToResult(): void
    toggleSort(key: string): void
    setPage(page: number): void
    setItemsPerPage(itemsPerPage: number): void
}

/**
 * Turns user actions on a data grid into new {@link DataGridOptions} for the owner. The state itself is never
 * stored here: every action computes the new options from the current source and emits them, the owner applies
 * them and feeds them back through the source.
 *
 * Options are emitted **only** for user actions and for clamping the page after a new result, never
 * on creation and never as an echo of a source change, so the owner can tell its own (programmatic) changes apart
 * from the user's ones. Follows Vuetify's data table semantics: changing the sort or the page size resets the
 * page to 1.
 *
 * @param source reactive getter of the current state
 * @param emit receives new options
 */
export function useDataGridOptions(source: () => DataGridOptionsSource,
                                   emit: (options: DataGridOptions) => void): DataGridOptionsActions {
    const pageCount: ComputedRef<number> = computed(() => computePageCount(source().totalCount, source().itemsPerPage))

    function emitOptions(page: number, itemsPerPage: number, sortBy: readonly DataGridSortItem[]): void {
        emit({ page, itemsPerPage, sortBy: sortBy.map(it => ({ ...it })) })
    }

    return {
        pageCount,
        clampPageToResult(): void {
            const current: DataGridOptionsSource = source()
            if (current.page > pageCount.value) {
                emitOptions(clampPage(current.page, pageCount.value), current.itemsPerPage, current.sortBy)
            }
        },
        toggleSort(key: string): void {
            const current: DataGridOptionsSource = source()
            emitOptions(1, current.itemsPerPage, toggleSort(current.sortBy, key, current.multiSort))
        },
        setPage(page: number): void {
            const current: DataGridOptionsSource = source()
            const newPage: number = clampPage(page, pageCount.value)
            if (newPage !== current.page) {
                emitOptions(newPage, current.itemsPerPage, current.sortBy)
            }
        },
        setItemsPerPage(itemsPerPage: number): void {
            const current: DataGridOptionsSource = source()
            if (itemsPerPage !== current.itemsPerPage) {
                emitOptions(1, itemsPerPage, current.sortBy)
            }
        }
    }
}
