import { describe, expect, test } from 'vitest'
import {
    clampResizedColumnWidth,
    computeAutoColumnWidths,
    dataGridCellBorder,
    dataGridCellPadding,
    dataGridDefaultColumnWidth,
    dataGridMinAutoColumnWidth,
    dataGridMinColumnWidth,
    type TextMeasurer
} from '@/modules/base/service/data-grid/dataGridColumnWidth'

// every character is 10px wide
const measure: TextMeasurer = (text: string) => text.length * 10

describe('computeAutoColumnWidths', () => {
    test('fits the widest value of each column', () => {
        const widths = computeAutoColumnWidths(
            [{ key: 'a' }, { key: 'b' }],
            [['1234567890', 'x'], ['12345678901', '']],
            measure
        )
        expect(widths.get('a')).toBe(110 + 2 * dataGridCellPadding + dataGridCellBorder)
        expect(widths.get('b')).toBe(dataGridMinAutoColumnWidth)
    })

    test('caps the width at the default maximum and the column maximum', () => {
        const longText: string = 'x'.repeat(100)
        const widths = computeAutoColumnWidths(
            [{ key: 'a' }, { key: 'b', maxAutoWidth: 300 }],
            [[longText, longText]],
            measure
        )
        expect(widths.get('a')).toBe(200)
        expect(widths.get('b')).toBe(300)
    })

    test('adds the width of the cell icon', () => {
        const widths = computeAutoColumnWidths([{ key: 'a', cellIconWidth: 28 }], [['1234567890']], measure)
        expect(widths.get('a')).toBe(100 + 2 * dataGridCellPadding + dataGridCellBorder + 28)
    })

    test('ignores the column title', () => {
        const widths = computeAutoColumnWidths(
            [{ key: 'a', title: 'A very long column title that would not fit' } as { key: string }],
            [['1']],
            measure
        )
        expect(widths.get('a')).toBe(dataGridMinAutoColumnWidth)
    })

    test('uses the default width without rows or without a measurer', () => {
        expect(computeAutoColumnWidths([{ key: 'a' }], [], measure).get('a')).toBe(dataGridDefaultColumnWidth)
        expect(computeAutoColumnWidths([{ key: 'a' }], [['123']], undefined).get('a')).toBe(dataGridDefaultColumnWidth)
    })
})

describe('clampResizedColumnWidth', () => {
    test('keeps the width above the minimum', () => {
        expect(clampResizedColumnWidth(10)).toBe(dataGridMinColumnWidth)
        expect(clampResizedColumnWidth(500.4)).toBe(500)
    })
})
