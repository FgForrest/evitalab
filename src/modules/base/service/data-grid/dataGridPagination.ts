/**
 * Number of pages for the given total count. An empty result still has one (empty) page, so that a page number
 * is always at least 1.
 */
export function computePageCount(totalCount: number, itemsPerPage: number): number {
    if (totalCount <= 0 || itemsPerPage <= 0) {
        return 1
    }
    return Math.ceil(totalCount / itemsPerPage)
}

/**
 * Clamps a 1-based page number into the valid range of pages.
 */
export function clampPage(page: number, pageCount: number): number {
    return Math.min(Math.max(page, 1), Math.max(pageCount, 1))
}

/**
 * 1-based inclusive range of items displayed on the given page, `{ from: 0, to: 0 }` for an empty result.
 */
export function computePageRange(page: number, itemsPerPage: number, totalCount: number): { from: number, to: number } {
    if (totalCount <= 0) {
        return { from: 0, to: 0 }
    }
    const from: number = (page - 1) * itemsPerPage + 1
    return { from, to: Math.min(from + itemsPerPage - 1, totalCount) }
}
