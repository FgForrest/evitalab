/**
 * Identifies a single cell of a data grid by a stable row key and a column key, so that the position survives
 * reloading or reordering of the rows.
 */
export interface DataGridCellPosition {
    rowKey: string | number
    columnKey: string
}
