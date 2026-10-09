import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'

/**
 * The counters carried by one collection's storage header.
 */
export class CollectionHeaderInfo {

    readonly entityTypePrimaryKey: number
    readonly version: bigint
    /**
     * Highest entity primary key assigned so far. The gap between it and the record count reveals how many entities
     * have been deleted over the collection's lifetime.
     */
    readonly lastPrimaryKey: number
    readonly lastEntityIndexPrimaryKey: number
    readonly lastInternalPriceId: number
    readonly lastKeyId: bigint
    /**
     * Largest single stored record ever observed in this collection. A high-water mark that never falls - label it
     * "largest ever seen", never "largest stored right now".
     */
    readonly maxRecordSizeBytes: bigint
    /**
     * When this collection's storage header was last written. Unset means unknown rather than zero - headers written
     * before evitaDB 2026.3 do not carry one. Render an unset value as "unknown", never as a date.
     */
    readonly lastModified: OffsetDateTime | undefined

    constructor(
        entityTypePrimaryKey: number,
        version: bigint,
        lastPrimaryKey: number,
        lastEntityIndexPrimaryKey: number,
        lastInternalPriceId: number,
        lastKeyId: bigint,
        maxRecordSizeBytes: bigint,
        lastModified: OffsetDateTime | undefined
    ) {
        this.entityTypePrimaryKey = entityTypePrimaryKey
        this.version = version
        this.lastPrimaryKey = lastPrimaryKey
        this.lastEntityIndexPrimaryKey = lastEntityIndexPrimaryKey
        this.lastInternalPriceId = lastInternalPriceId
        this.lastKeyId = lastKeyId
        this.maxRecordSizeBytes = maxRecordSizeBytes
        this.lastModified = lastModified
    }
}
