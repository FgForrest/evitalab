import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'

/**
 * Coordinates of one committed catalog version, as the History page lists them.
 *
 * Deliberately only the coordinates: what actually changed in a version is rendered by `history-viewer`, which the
 * page links out to rather than reimplementing. The one action on a row — restoring the catalog to that version — is
 * requested from `RestoreCatalogVersionDialog`.
 */
export class CatalogVersionSummary {

    readonly version: number
    readonly commitTimestamp: OffsetDateTime | undefined
    readonly mutationCount: number
    readonly walSizeInBytes: number

    constructor(
        version: number,
        commitTimestamp: OffsetDateTime | undefined,
        mutationCount: number,
        walSizeInBytes: number
    ) {
        this.version = version
        this.commitTimestamp = commitTimestamp
        this.mutationCount = mutationCount
        this.walSizeInBytes = walSizeInBytes
    }
}
