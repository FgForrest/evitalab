import { serializeJsonWithBigInt } from '@/utils/JsonUtil'
import { isPlainObjectOrArray } from '@/utils/object'
import type { DataGridColumn } from '@/modules/base/model/data-grid/DataGridColumn'
import type { DataGridValuePrinter } from '@/modules/base/service/data-grid/DataGridValuePrinter'

/**
 * Default cell formatter of a data grid: plain objects and arrays are serialized to JSON, any other value (primitives
 * and class instances alike) prints its string form and a missing value prints as an empty string. Columns holding
 * values that need a human-readable form of their own supply a `printer`.
 */
export function formatDataGridValue(value: unknown): string {
    if (value == undefined) {
        return ''
    }
    if (isPlainObjectOrArray(value)) {
        return serializeJsonWithBigInt(value)
    }
    return String(value)
}

/**
 * Printer of the columns without a printer of their own, see {@link formatDataGridValue}.
 */
export const defaultDataGridValuePrinter: DataGridValuePrinter<unknown, unknown, unknown> = {
    print: value => formatDataGridValue(value)
}

/**
 * Prints a single cell through the column's printer, or the {@link defaultDataGridValuePrinter} when the column has
 * none.
 */
export function printDataGridCell<V, R, C>(column: Pick<DataGridColumn<V, R, C>, 'printer'>,
                                           value: V | undefined,
                                           row: R,
                                           context: C): string {
    if (column.printer != undefined) {
        return column.printer.print(value, row, context)
    }
    return defaultDataGridValuePrinter.print(value, row, context)
}
