import type { DataGridSortItem } from '@/modules/base/model/data-grid/DataGridSortItem'

/**
 * Returns a new sort list with the sort of the given column toggled, following Vuetify's data table semantics:
 * an unsorted column is sorted ascending (appended in multi-sort mode, replacing the list otherwise), an ascending
 * column becomes descending and a descending column is removed from the list.
 */
export function toggleSort(sortBy: readonly DataGridSortItem[], key: string, multiSort: boolean): DataGridSortItem[] {
    const existing: DataGridSortItem | undefined = sortBy.find(it => it.key === key)
    if (existing == undefined) {
        const added: DataGridSortItem = { key, order: 'asc' }
        return multiSort ? [...sortBy.map(it => ({ ...it })), added] : [added]
    }
    if (existing.order === 'desc') {
        return sortBy.filter(it => it.key !== key).map(it => ({ ...it }))
    }
    return sortBy.map(it => it.key === key ? { key, order: 'desc' } : { ...it })
}

/**
 * Compares two sort lists by value.
 */
export function isSameSortBy(left: readonly DataGridSortItem[], right: readonly DataGridSortItem[]): boolean {
    return left.length === right.length &&
        left.every((it, index) => it.key === right[index]?.key && it.order === right[index]?.order)
}
