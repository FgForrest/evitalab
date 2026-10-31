import { describe, expect, test } from 'vitest'
import { isSameSortBy, toggleSort } from '@/modules/base/service/data-grid/dataGridSort'
import type { DataGridSortItem } from '@/modules/base/model/data-grid/DataGridSortItem'

describe('toggleSort', () => {
    test('sorts an unsorted column ascending', () => {
        expect(toggleSort([], 'code', true)).toEqual([{ key: 'code', order: 'asc' }])
    })

    test('appends a newly sorted column in multi-sort mode', () => {
        expect(toggleSort([{ key: 'name', order: 'desc' }], 'code', true))
            .toEqual([{ key: 'name', order: 'desc' }, { key: 'code', order: 'asc' }])
    })

    test('replaces the sort list when not in multi-sort mode', () => {
        expect(toggleSort([{ key: 'name', order: 'desc' }], 'code', false)).toEqual([{ key: 'code', order: 'asc' }])
    })

    test('turns an ascending column descending in place', () => {
        expect(toggleSort([{ key: 'code', order: 'asc' }, { key: 'name', order: 'asc' }], 'code', true))
            .toEqual([{ key: 'code', order: 'desc' }, { key: 'name', order: 'asc' }])
    })

    test('removes a descending column', () => {
        expect(toggleSort([{ key: 'code', order: 'desc' }, { key: 'name', order: 'asc' }], 'code', true))
            .toEqual([{ key: 'name', order: 'asc' }])
    })

    test('does not mutate the input', () => {
        const sortBy: DataGridSortItem[] = [{ key: 'code', order: 'asc' }]
        toggleSort(sortBy, 'code', true)
        expect(sortBy).toEqual([{ key: 'code', order: 'asc' }])
    })
})

describe('isSameSortBy', () => {
    test('compares by value', () => {
        expect(isSameSortBy([{ key: 'a', order: 'asc' }], [{ key: 'a', order: 'asc' }])).toBe(true)
        expect(isSameSortBy([{ key: 'a', order: 'asc' }], [{ key: 'a', order: 'desc' }])).toBe(false)
        expect(isSameSortBy([{ key: 'a', order: 'asc' }], [])).toBe(false)
    })
})
