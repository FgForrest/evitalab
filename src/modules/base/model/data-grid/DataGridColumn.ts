import type { DataGridValuePrinter } from '@/modules/base/service/data-grid/DataGridValuePrinter'
import type { DataGridValueEditor } from '@/modules/base/service/data-grid/DataGridValueEditor'

/**
 * Definition of a single column of a data grid. Rows are plain objects keyed by {@link key}, the grid reads the
 * original cell value from them and prints it using {@link printer}.
 *
 * @typeParam C grid-wide context the grid passes to the printer and the editor
 */
export interface DataGridColumn<V = unknown, R = Readonly<Record<string, V | undefined>>, C = void> {
    /**
     * Key of the cell value in a row, also identifies the column in sort, width and selection state.
     */
    key: string
    title: string
    sortable?: boolean
    /**
     * Icons rendered in the header before the title.
     */
    prependIcons?: string[]
    /**
     * Icons rendered in the header after the title.
     */
    appendIcons?: string[]
    /**
     * Converts the original cell value into the human-readable string displayed in the cell. The same string is
     * used to compute the automatic column width. Defaults to `defaultDataGridValuePrinter`.
     */
    printer?: DataGridValuePrinter<V, R, C>
    /**
     * Width in pixels of anything the cell slot draws next to the formatted text (e.g. a prepended icon), added to
     * the measured text width when computing the automatic column width.
     */
    cellIconWidth?: number
    /**
     * Upper bound of the automatic column width in pixels. The user can still resize the column beyond it.
     */
    maxAutoWidth?: number
    /**
     * Converts cell values of this column to and from the text an editor works with. Only a column with an editor
     * can be edited in place.
     */
    editor?: DataGridValueEditor<V, R, C>
}
