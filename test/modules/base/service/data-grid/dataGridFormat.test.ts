import { describe, expect, test } from 'vitest'
import { formatDataGridValue, printDataGridCell } from '@/modules/base/service/data-grid/dataGridFormat'
import type { DataGridValuePrinter } from '@/modules/base/service/data-grid/DataGridValuePrinter'

describe('formatDataGridValue', () => {
    test('prints a missing value as an empty string', () => {
        expect(formatDataGridValue(undefined)).toBe('')
        expect(formatDataGridValue(null)).toBe('')
    })

    test('stringifies primitives', () => {
        expect(formatDataGridValue(42)).toBe('42')
        expect(formatDataGridValue(false)).toBe('false')
        expect(formatDataGridValue(10n)).toBe('10')
    })

    test('prints the string form of a class instance', () => {
        class Printed {
            toString(): string {
                return 'Oct 28, 2026'
            }
        }
        expect(formatDataGridValue(new Printed())).toBe('Oct 28, 2026')
    })

    test('serializes plain objects and arrays to JSON including big integers', () => {
        expect(formatDataGridValue({ a: 1, b: 2n })).toBe('{"a":1,"b":"2"}')
        expect(formatDataGridValue([1, 2n])).toBe('[1,"2"]')
    })
})

type Row = { readonly amount?: number, readonly currency: string }
type Context = { readonly withCurrency: boolean }

describe('printDataGridCell', () => {
    const printer: DataGridValuePrinter<number, Row, Context> = {
        print: (value, row, context) => value == undefined
            ? '-'
            : (context.withCurrency ? `${value} ${row.currency}` : String(value))
    }

    test('prints through the column printer with the row and the grid context', () => {
        const row: Row = { amount: 10, currency: 'EUR' }
        expect(printDataGridCell({ printer }, row.amount, row, { withCurrency: true })).toBe('10 EUR')
        expect(printDataGridCell({ printer }, row.amount, row, { withCurrency: false })).toBe('10')
    })

    test('passes a missing value to the column printer', () => {
        expect(printDataGridCell({ printer }, undefined, { currency: 'EUR' }, { withCurrency: true })).toBe('-')
    })

    test('falls back to the default printer for a column without a printer', () => {
        expect(printDataGridCell<unknown, unknown, void>({}, { a: 1 }, {}, undefined)).toBe('{"a":1}')
        expect(printDataGridCell<unknown, unknown, void>({}, 42, {}, undefined)).toBe('42')
        expect(printDataGridCell<unknown, unknown, void>({}, undefined, {}, undefined)).toBe('')
    })
})
