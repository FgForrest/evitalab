import { describe, expect, test } from 'vitest'
import { clampPage, computePageCount, computePageRange } from '@/modules/base/service/data-grid/dataGridPagination'

describe('computePageCount', () => {
    test('rounds partial pages up', () => {
        expect(computePageCount(51, 25)).toBe(3)
        expect(computePageCount(50, 25)).toBe(2)
    })

    test('has one page for an empty result', () => {
        expect(computePageCount(0, 25)).toBe(1)
    })
})

describe('clampPage', () => {
    test('never returns a page below 1 or above the page count', () => {
        expect(clampPage(0, 3)).toBe(1)
        expect(clampPage(5, 3)).toBe(3)
        expect(clampPage(5, 0)).toBe(1)
        expect(clampPage(2, 3)).toBe(2)
    })
})

describe('computePageRange', () => {
    test('returns the 1-based inclusive range of the page', () => {
        expect(computePageRange(1, 25, 60)).toEqual({ from: 1, to: 25 })
        expect(computePageRange(3, 25, 60)).toEqual({ from: 51, to: 60 })
    })

    test('returns an empty range for an empty result', () => {
        expect(computePageRange(1, 25, 0)).toEqual({ from: 0, to: 0 })
    })
})
