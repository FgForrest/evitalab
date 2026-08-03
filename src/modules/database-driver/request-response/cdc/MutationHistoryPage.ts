import { List as ImmutableList } from 'immutable'
import type { ChangeCatalogCapture } from '@/modules/database-driver/request-response/cdc/ChangeCatalogCapture.ts'

/**
 * A single page of a catalog's mutation history.
 *
 * `records` is what the UI renders: the captures the server streamed, with the locally fetched
 * transaction overviews merged in. `captureCount` counts only the streamed captures, which is what
 * pagination and the "load more" decision must be based on — the merged list contains additional
 * synthesised records and therefore does not relate to the requested page size.
 */
export class MutationHistoryPage {

    readonly records: ImmutableList<ChangeCatalogCapture>
    readonly captureCount: number

    constructor(records: ImmutableList<ChangeCatalogCapture>, captureCount: number) {
        this.records = records
        this.captureCount = captureCount
    }

    static empty(): MutationHistoryPage {
        return new MutationHistoryPage(ImmutableList(), 0)
    }
}

/**
 * Drops every capture that is not strictly newer than the given catalog version.
 *
 * The mutation history API is reverse-only (newest first) and has no lower bound, so this boundary is
 * applied by the client. The input is expected in the server's reverse order, which makes the
 * operation a prefix-preserving `takeWhile`.
 *
 * @param captures captures in the server's reverse (newest first) order
 * @param newerThanVersion exclusive lower bound on the catalog version; no-op when undefined
 */
export function truncateBelowBoundary(captures: ChangeCatalogCapture[],
                                      newerThanVersion: number | undefined): ChangeCatalogCapture[] {
    if (newerThanVersion == undefined) {
        return captures
    }
    const boundaryIndex: number = captures.findIndex(capture => capture.version <= newerThanVersion)
    return boundaryIndex < 0 ? captures : captures.slice(0, boundaryIndex)
}

/**
 * Merges locally fetched transaction overviews into the streamed captures.
 *
 * The overviews are interleaved by catalog version instead of being prepended as a block, so the
 * merged list keeps the reverse order of the captures. Within a version its overview comes first: it
 * is the transaction lead event (index 0), which is how the visualisation processor groups the
 * version's captures under it.
 *
 * Overviews of versions absent from the captures are dropped — the version list they were requested
 * for is derived from the captures, so this only happens when the server answers with more.
 *
 * @param captures captures in the server's reverse (newest first) order
 * @param transactionOverviews synthesised transaction records, in any order
 */
export function mergeTransactionOverviews(captures: ChangeCatalogCapture[],
                                          transactionOverviews: ChangeCatalogCapture[]): ChangeCatalogCapture[] {
    if (transactionOverviews.length === 0) {
        return captures
    }

    const overviewsByVersion: Map<number, ChangeCatalogCapture[]> = new Map()
    for (const overview of transactionOverviews) {
        const versionOverviews: ChangeCatalogCapture[] = overviewsByVersion.get(overview.version) ?? []
        versionOverviews.push(overview)
        overviewsByVersion.set(overview.version, versionOverviews)
    }

    const merged: ChangeCatalogCapture[] = []
    let currentVersion: number | undefined = undefined
    for (const capture of captures) {
        if (capture.version !== currentVersion) {
            currentVersion = capture.version
            merged.push(...(overviewsByVersion.get(currentVersion) ?? []))
            // a version's overview is emitted once, even if the version is not contiguous in the input
            overviewsByVersion.delete(currentVersion)
        }
        merged.push(capture)
    }
    return merged
}
