/**
 * The four version watermarks the commit pipeline maintains, always in this order. The differences between them
 * answer specific operational questions - see the individual accessors.
 */
export class CommitPipelineStatistics {

    readonly lastAssignedCatalogVersion: bigint
    readonly lastWrittenCatalogVersion: bigint
    readonly lastDurableCatalogVersion: bigint
    readonly lastFinalizedCatalogVersion: bigint

    constructor(
        lastAssignedCatalogVersion: bigint,
        lastWrittenCatalogVersion: bigint,
        lastDurableCatalogVersion: bigint,
        lastFinalizedCatalogVersion: bigint
    ) {
        this.lastAssignedCatalogVersion = lastAssignedCatalogVersion
        this.lastWrittenCatalogVersion = lastWrittenCatalogVersion
        this.lastDurableCatalogVersion = lastDurableCatalogVersion
        this.lastFinalizedCatalogVersion = lastFinalizedCatalogVersion
    }

    /**
     * Transactions accepted but not yet in the write-ahead log.
     */
    get assignedToWritten(): bigint {
        return this.lastAssignedCatalogVersion - this.lastWrittenCatalogVersion
    }

    /**
     * Transactions in the log but not yet forced to the device - what a crash would replay.
     */
    get writtenToDurable(): bigint {
        return this.lastWrittenCatalogVersion - this.lastDurableCatalogVersion
    }

    /**
     * Transactions durable but not yet incorporated into the live view.
     */
    get durableToVisible(): bigint {
        return this.lastDurableCatalogVersion - this.lastFinalizedCatalogVersion
    }

    /**
     * Versions accepted but not yet visible to readers.
     */
    get pipelineDepth(): bigint {
        return this.lastAssignedCatalogVersion - this.lastFinalizedCatalogVersion
    }
}
