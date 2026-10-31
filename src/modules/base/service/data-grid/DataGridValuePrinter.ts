/**
 * Turns a cell value of a data grid column into the text displayed in the cell. The text also drives the automatic
 * column width.
 *
 * @typeParam V type of the cell values
 * @typeParam R type of the rows
 * @typeParam C grid-wide context passed by the grid's owner (`void` when the grid has none)
 */
export interface DataGridValuePrinter<V, R, C = void> {
    /**
     * Returns the text of the cell; a missing value is passed as `undefined`.
     */
    print(value: V | undefined, row: R, context: C): string
}
