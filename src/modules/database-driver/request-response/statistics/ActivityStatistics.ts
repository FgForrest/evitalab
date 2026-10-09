import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'

/**
 * How much write work a catalog has done, and how fast it is doing it right now.
 *
 * The counters are process-scoped: they start at zero when the catalog is loaded and are not persisted, so
 * {@link countingSince} is what makes them readable. The rates are short-window and decay while nothing is written.
 */
export class ActivityStatistics {

    readonly transactionsCommitted: bigint
    readonly transactionsRolledBack: bigint
    readonly transactionsConflicted: bigint
    readonly mutationsApplied: bigint
    readonly walBytesAppended: bigint
    readonly pipelineDepth: bigint
    readonly transactionsPerSecond: number
    readonly mutationsPerSecond: number
    readonly walBytesPerSecond: number
    /**
     * The instant the counters were zeroed - never before this catalog was opened.
     */
    readonly countingSince: OffsetDateTime | undefined

    constructor(
        transactionsCommitted: bigint,
        transactionsRolledBack: bigint,
        transactionsConflicted: bigint,
        mutationsApplied: bigint,
        walBytesAppended: bigint,
        pipelineDepth: bigint,
        transactionsPerSecond: number,
        mutationsPerSecond: number,
        walBytesPerSecond: number,
        countingSince: OffsetDateTime | undefined
    ) {
        this.transactionsCommitted = transactionsCommitted
        this.transactionsRolledBack = transactionsRolledBack
        this.transactionsConflicted = transactionsConflicted
        this.mutationsApplied = mutationsApplied
        this.walBytesAppended = walBytesAppended
        this.pipelineDepth = pipelineDepth
        this.transactionsPerSecond = transactionsPerSecond
        this.mutationsPerSecond = mutationsPerSecond
        this.walBytesPerSecond = walBytesPerSecond
        this.countingSince = countingSince
    }
}
