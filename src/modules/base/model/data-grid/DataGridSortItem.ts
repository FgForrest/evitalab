/**
 * Sort direction of a single {@link DataGridSortItem}.
 */
export type DataGridSortOrder = 'asc' | 'desc'

/**
 * A single sorted column of a data grid. The position in the sort list is the sort priority.
 */
export interface DataGridSortItem {
    key: string
    order?: DataGridSortOrder
}
