import { test, expect } from 'vitest'
import {
    DurabilityStatistics
} from '../../../../../src/modules/database-driver/request-response/statistics/DurabilityStatistics'
import { OffsetDateTime } from '../../../../../src/modules/database-driver/data-type/OffsetDateTime'

/**
 * The durability block carries exactly one health verdict, and it is on the fence depth. Cadence must not carry one:
 * it cannot tell a catalog too busy to checkpoint on time from one with nothing to checkpoint, and on a write-idle
 * catalog it reads far above the interval while nothing at all is wrong.
 */
function statistics(
    checkpointIntervalMillis: bigint,
    lastCadenceMillis: bigint,
    lastFenceDepthMillis: bigint,
    checkpointsCompleted: bigint = 12n
): DurabilityStatistics {
    return new DurabilityStatistics(
        checkpointIntervalMillis,
        lastCadenceMillis,
        lastFenceDepthMillis,
        3,
        14n,
        checkpointsCompleted,
        checkpointsCompleted === 0n ? undefined : OffsetDateTime.of(1757577600n, 0, 'Z'),
        OffsetDateTime.of(1757570000n, 0, 'Z')
    )
}

test('Should not flag an idle catalog checkpointing once a minute on a one-second interval as overdue', () => {
    const idle: DurabilityStatistics = statistics(1000n, 60_000n, 0n)
    expect(idle.fenceOverdue).toBe(false)
    expect(idle.fenceSeverelyOverdue).toBe(false)
})

test('Should flag a fence depth above the configured interval as overdue', () => {
    const behind: DurabilityStatistics = statistics(1000n, 4000n, 1500n)
    expect(behind.fenceOverdue).toBe(true)
    expect(behind.fenceSeverelyOverdue).toBe(false)
})

test('Should keep a fence depth at the configured interval within it', () => {
    expect(statistics(1000n, 4000n, 1000n).fenceOverdue).toBe(false)
})

test('Should escalate a fence depth beyond five intervals', () => {
    const far: DurabilityStatistics = statistics(1000n, 9000n, 5001n)
    expect(far.fenceOverdue).toBe(true)
    expect(far.fenceSeverelyOverdue).toBe(true)
})

test('Should judge the same depth against the interval it is read against', () => {
    expect(statistics(1000n, 60_000n, 30_000n).fenceOverdue).toBe(true)
    expect(statistics(30_000n, 60_000n, 30_000n).fenceOverdue).toBe(false)
})

test('Should never exceed an unconfigured interval', () => {
    const noInterval: DurabilityStatistics = statistics(0n, 0n, 0n)
    expect(noInterval.fenceOverdue).toBe(false)
    expect(noInterval.fenceSeverelyOverdue).toBe(false)
})

test('Should report a catalog that has not checkpointed yet instead of a row of zeros', () => {
    expect(statistics(1000n, 0n, 0n, 0n).checkpointed).toBe(false)
    expect(statistics(1000n, 1200n, 300n).checkpointed).toBe(true)
})
