import { describe, expect, test } from 'vitest'
import { nextTick, reactive } from 'vue'
import { type DataGridOptionsSource, useDataGridOptions } from '@/modules/base/composable/data-grid/useDataGridOptions'
import type { DataGridOptions } from '@/modules/base/model/data-grid/DataGridOptions'

function setup(initial: Partial<DataGridOptionsSource> = {}) {
    const source: DataGridOptionsSource = reactive({
        page: 1,
        itemsPerPage: 25,
        sortBy: [],
        totalCount: 100,
        multiSort: true,
        ...initial
    })
    const emitted: DataGridOptions[] = []
    const actions = useDataGridOptions(() => source, options => emitted.push(options))
    return { source, emitted, actions }
}

describe('useDataGridOptions', () => {
    test('does not emit on creation or when the owner changes the state', async () => {
        const { source, emitted } = setup()
        source.page = 3
        source.sortBy = [{ key: 'code', order: 'asc' }]
        source.itemsPerPage = 10
        await nextTick()
        expect(emitted).toEqual([])
    })

    test('emits a toggled sort and resets the page', () => {
        const { emitted, actions } = setup({ page: 3, sortBy: [{ key: 'name', order: 'asc' }] })
        actions.toggleSort('code')
        expect(emitted).toEqual([{
            page: 1,
            itemsPerPage: 25,
            sortBy: [{ key: 'name', order: 'asc' }, { key: 'code', order: 'asc' }]
        }])
    })

    test('emits a page change only when the page differs', () => {
        const { emitted, actions } = setup()
        actions.setPage(1)
        actions.setPage(2)
        expect(emitted).toEqual([{ page: 2, itemsPerPage: 25, sortBy: [] }])
    })

    test('emits a page size change and resets the page', () => {
        const { emitted, actions } = setup({ page: 3 })
        actions.setItemsPerPage(50)
        expect(emitted).toEqual([{ page: 1, itemsPerPage: 50, sortBy: [] }])
    })

    test('clamps the page to the last page of a new result', () => {
        const { source, emitted, actions } = setup({ page: 4 })
        source.totalCount = 30
        actions.clampPageToResult()
        expect(emitted).toEqual([{ page: 2, itemsPerPage: 25, sortBy: [] }])
    })

    test('clamps a restored page when the first result fits on one page', () => {
        // regression: the page count stays 1 from before the first result to after it, so only a check per result
        // catches a restored page 3 of a result with 10 entities
        const { source, emitted, actions } = setup({ page: 3, totalCount: 0 })
        source.totalCount = 10
        actions.clampPageToResult()
        expect(emitted).toEqual([{ page: 1, itemsPerPage: 25, sortBy: [] }])
    })

    test('clamps to the first page for an empty result', () => {
        const { emitted, actions } = setup({ page: 4, totalCount: 0 })
        actions.clampPageToResult()
        expect(emitted).toEqual([{ page: 1, itemsPerPage: 25, sortBy: [] }])
    })

    test('does not clamp a page within the result', () => {
        const { emitted, actions } = setup({ page: 4 })
        actions.clampPageToResult()
        expect(emitted).toEqual([])
    })
})
