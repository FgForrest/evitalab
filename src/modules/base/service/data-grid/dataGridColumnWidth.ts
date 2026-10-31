import type { DataGridColumn } from '@/modules/base/model/data-grid/DataGridColumn'

/**
 * Horizontal padding of a data grid cell on each side, in pixels.
 */
export const dataGridCellPadding: number = 12
/**
 * Width of the separator drawn on the right edge of a data grid cell, in pixels.
 */
export const dataGridCellBorder: number = 1
/**
 * Lower bound of an automatic column width, in pixels.
 */
export const dataGridMinAutoColumnWidth: number = 80
/**
 * Default upper bound of an automatic column width, in pixels.
 */
export const dataGridDefaultMaxAutoColumnWidth: number = 200
/**
 * Width of a column when there is no data to compute the width from, in pixels.
 */
export const dataGridDefaultColumnWidth: number = 120
/**
 * Lower bound of a column width the user can resize a column to, in pixels.
 */
export const dataGridMinColumnWidth: number = 48

/**
 * Measures the rendered width of a text in pixels.
 */
export type TextMeasurer = (text: string) => number

/**
 * Computes the automatic width of each column from the widest formatted cell value in the column, clamped between
 * {@link dataGridMinAutoColumnWidth} and the column's maximum. The column title does not participate, a long title
 * is ellipsized instead. Without a measurer (not mounted yet) or without rows, columns get
 * {@link dataGridDefaultColumnWidth}.
 *
 * @param columns displayed columns
 * @param formattedCells formatted cell values, indexed by row and then by column position
 * @param measure text measurer, undefined until it can be created
 * @returns width in pixels for each column key
 */
export function computeAutoColumnWidths(columns: readonly Pick<DataGridColumn, 'key' | 'cellIconWidth' | 'maxAutoWidth'>[],
                                        formattedCells: readonly (readonly string[])[],
                                        measure: TextMeasurer | undefined): Map<string, number> {
    const widths: Map<string, number> = new Map<string, number>()
    columns.forEach((column, columnIndex) => {
        if (measure == undefined || formattedCells.length === 0) {
            widths.set(column.key, dataGridDefaultColumnWidth)
            return
        }
        let maxTextWidth: number = 0
        for (const row of formattedCells) {
            const text: string | undefined = row[columnIndex]
            if (text != undefined && text.length > 0) {
                maxTextWidth = Math.max(maxTextWidth, measure(text))
            }
        }
        const contentWidth: number = Math.ceil(maxTextWidth) + 2 * dataGridCellPadding + dataGridCellBorder +
            (column.cellIconWidth ?? 0)
        const maxWidth: number = column.maxAutoWidth ?? dataGridDefaultMaxAutoColumnWidth
        widths.set(column.key, Math.min(Math.max(contentWidth, dataGridMinAutoColumnWidth), maxWidth))
    })
    return widths
}

/**
 * Clamps a width the user resized a column to.
 */
export function clampResizedColumnWidth(width: number): number {
    return Math.max(Math.round(width), dataGridMinColumnWidth)
}
