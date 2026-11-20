/**
 * Typed numeric measurements the engine recorded for a single {@link QueryTelemetry} step. Recorded on the root
 * (`OVERALL`) step only.
 *
 * Every member is optional and **absence is meaningful**: a missing metric means "not measured", which is different
 * from a measured `0` (`recordsReturned`, `ioFetchCount`, `ioFetchedSizeBytes` and `prefetched` can all legitimately
 * be zero/false). Render an absent value as a placeholder, never as `0`.
 */
export class QueryTelemetryMetrics {
    /**
     * How many records the planner expected the filtering formula to match.
     */
    readonly estimatedCardinality: bigint | undefined
    /**
     * How many records the filtering formula really matched, before the requested page was cut out of them.
     */
    readonly actualCardinality: bigint | undefined
    /**
     * Unitless cost the planner estimated for the filtering formula it chose. Absent when the estimate overflowed.
     */
    readonly estimatedCost: bigint | undefined
    /**
     * Cost the filtering formula really incurred, on the same scale as {@link estimatedCost}. Absent when the
     * formula was never computed.
     */
    readonly actualCost: bigint | undefined
    /**
     * How many records were actually handed back (the size of the returned page).
     */
    readonly recordsReturned: bigint | undefined
    /**
     * How many times the storage was read while assembling the response.
     */
    readonly ioFetchCount: bigint | undefined
    /**
     * How many bytes were read from the storage while assembling the response.
     */
    readonly ioFetchedSizeBytes: bigint | undefined
    /**
     * Whether the planner prefetched entity bodies and filtered over them instead of consulting indexes. With
     * `true`, the index sub-tree of the executed plan legitimately reports nothing computed.
     */
    readonly prefetched: boolean | undefined

    constructor(estimatedCardinality: bigint | undefined,
                actualCardinality: bigint | undefined,
                estimatedCost: bigint | undefined,
                actualCost: bigint | undefined,
                recordsReturned: bigint | undefined,
                ioFetchCount: bigint | undefined,
                ioFetchedSizeBytes: bigint | undefined,
                prefetched: boolean | undefined) {
        this.estimatedCardinality = estimatedCardinality
        this.actualCardinality = actualCardinality
        this.estimatedCost = estimatedCost
        this.actualCost = actualCost
        this.recordsReturned = recordsReturned
        this.ioFetchCount = ioFetchCount
        this.ioFetchedSizeBytes = ioFetchedSizeBytes
        this.prefetched = prefetched
    }
}
