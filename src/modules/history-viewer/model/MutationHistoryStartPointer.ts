import type { ChangeCatalogCapture } from '@/modules/database-driver/request-response/cdc/ChangeCatalogCapture.ts'

/**
 * Boundary of the mutation history list requested by the user via "load only records newer than now".
 *
 * It holds the newest catalog version the user had already seen when the pointer was created; every
 * subsequent load then keeps only records strictly newer than it. The mutation history API cannot
 * express such a bound, so it is applied client-side by the driver.
 */
export class MutationHistoryStartPointer {

    /**
     * Exclusive lower bound on the catalog version.
     */
    readonly newerThanVersion: number

    constructor(newerThanVersion: number) {
        this.newerThanVersion = newerThanVersion
    }
}

/**
 * Returns the newest catalog version among the given records, or `undefined` when there are none.
 *
 * Used both to pick the start-pointer boundary from the records the user already sees and to anchor
 * reverse pagination on the first page. It is deliberately a maximum rather than "the first record":
 * the list also carries locally merged transaction overviews, whose position must not influence the
 * result. Their versions are always a subset of the streamed captures' versions, so the maximum is the
 * newest streamed capture's version either way — which is why no provenance flag is needed here.
 */
export function selectNewestVersion(records: ChangeCatalogCapture[]): number | undefined {
    let newestVersion: number | undefined = undefined
    for (const record of records) {
        if (newestVersion == undefined || record.version > newestVersion) {
            newestVersion = record.version
        }
    }
    return newestVersion
}

/**
 * Whether another page of the mutation history may exist.
 *
 * Only the records the server streamed count — the merged transaction overviews routinely push the
 * rendered size above the page size. A page that is not full means the history ended or the start
 * pointer's boundary was reached, and in both cases there is nothing more to load.
 *
 * @param captureCount number of streamed captures on the last fetched page, `undefined` before the
 *                     first fetch
 * @param pageSize the requested page size
 */
export function hasMoreRecords(captureCount: number | undefined, pageSize: number): boolean {
    return captureCount == undefined || captureCount >= pageSize
}
