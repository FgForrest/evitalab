/**
 * Converts a cell value of a data grid column to and from the text an editor works with. A column with an editor is
 * editable.
 *
 * @typeParam V type of the cell values
 * @typeParam R type of the rows
 * @typeParam C grid-wide context passed by the grid's owner (`void` when the grid has none)
 */
export interface DataGridValueEditor<V, R, C = void> {
    /**
     * Returns the text the editor starts with; a missing value is passed as `undefined`.
     */
    toEditRepresentation(value: V | undefined, row: R, context: C): string

    /**
     * Parses the edited text back into a cell value. Throws an error with a translated message when the text is not
     * a valid value.
     */
    parse(representation: string, row: R, context: C): V | undefined
}
