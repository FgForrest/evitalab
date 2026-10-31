import type { DataGridSortItem } from '@/modules/base/model/data-grid/DataGridSortItem'

/**
 * Pagination and sort state of a data grid, emitted to the grid's owner whenever the user changes it.
 */
export interface DataGridOptions {
    /**
     * 1-based page number.
     */
    page: number
    itemsPerPage: number
    sortBy: DataGridSortItem[]
}
