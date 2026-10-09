import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'

/**
 * How far behind the physical device the catalog is allowed to run, and what the last checkpoint to catch it up cost.
 *
 * This is the time-domain answer to "how much replay would a crash cost me right now"; the commit pipeline answers
 * the same question in catalog versions, and neither derives from the other.
 */
export class DurabilityStatistics {

    readonly checkpointIntervalMillis: bigint
    /**
     * Time between the last two completed checkpoints; `0` before the first one completes, and measured from the
     * catalog's open for the first one. A value above {@link checkpointIntervalMillis} is not a problem signal on its
     * own - it is the normal reading for a rarely written catalog, which has nothing to checkpoint in between. The
     * health signal is {@link fenceOverdue}.
     */
    readonly lastCadenceMillis: bigint
    /**
     * How long the oldest change covered by the last checkpoint waited to reach the device - roughly the replay a
     * crash at that moment would have cost. `0` means that checkpoint deferred nothing, not that it was instant, and
     * it is never the duration of the device force, which is {@link lastForceDurationMillis}.
     */
    readonly lastFenceDepthMillis: bigint
    readonly lastFilesForced: number
    readonly lastForceDurationMillis: bigint
    readonly checkpointsCompleted: bigint
    /**
     * When the last checkpoint completed. Unset when none has since this catalog was opened - a freshly opened or
     * write-idle catalog, not a stalled one.
     */
    readonly lastCheckpointAt: OffsetDateTime | undefined
    readonly countingSince: OffsetDateTime | undefined

    constructor(
        checkpointIntervalMillis: bigint,
        lastCadenceMillis: bigint,
        lastFenceDepthMillis: bigint,
        lastFilesForced: number,
        lastForceDurationMillis: bigint,
        checkpointsCompleted: bigint,
        lastCheckpointAt: OffsetDateTime | undefined,
        countingSince: OffsetDateTime | undefined
    ) {
        this.checkpointIntervalMillis = checkpointIntervalMillis
        this.lastCadenceMillis = lastCadenceMillis
        this.lastFenceDepthMillis = lastFenceDepthMillis
        this.lastFilesForced = lastFilesForced
        this.lastForceDurationMillis = lastForceDurationMillis
        this.checkpointsCompleted = checkpointsCompleted
        this.lastCheckpointAt = lastCheckpointAt
        this.countingSince = countingSince
    }

    /**
     * Whether any checkpoint has completed since the catalog was opened. When none has, every measured figure below
     * describes nothing and reads `0`, which is a freshly opened or write-idle catalog rather than a stalled one.
     */
    get checkpointed(): boolean {
        return this.checkpointsCompleted > 0n
    }

    /**
     * The single durability alert: the last checkpoint made a change durable later than the configured interval
     * allows, so a crash would cost more replay than the configuration asks for.
     *
     * The interval is a target rather than a guarantee, which is why the comparison is relative - 30 s of fence depth
     * is alarming on a 1 s interval and exactly as configured on a 30 s one.
     */
    get fenceOverdue(): boolean {
        return this.checkpointIntervalMillis > 0n && this.lastFenceDepthMillis > this.checkpointIntervalMillis
    }

    /**
     * Fence depth an order of magnitude past the interval - the reading that is worth escalating rather than watching.
     */
    get fenceSeverelyOverdue(): boolean {
        return this.checkpointIntervalMillis > 0n &&
            this.lastFenceDepthMillis > this.checkpointIntervalMillis * 5n
    }
}
