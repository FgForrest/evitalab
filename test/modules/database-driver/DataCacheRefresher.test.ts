import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { DataCacheRefresher } from '../../../src/modules/database-driver/DataCacheRefresher'
import { EvitaClient } from '../../../src/modules/database-driver/EvitaClient'
import { ChangeStreamStatus } from '../../../src/modules/database-driver/model/ChangeStreamStatus'
import { CaptureResponseType } from '../../../src/modules/database-driver/request-response/cdc/CaptureResponseType'
import {
    RegisterSystemChangeCaptureResponse
} from '../../../src/modules/database-driver/request-response/cdc/RegisterSystemChangeCaptureResponse'
import { ChangeSystemCapture } from '../../../src/modules/database-driver/request-response/cdc/ChangeSystemCapture'
import { HeartBeat } from '../../../src/modules/database-driver/request-response/cdc/HeartBeat'
import { Operation } from '../../../src/modules/database-driver/request-response/cdc/Operation'
import { OffsetDateTime, Timestamp } from '../../../src/modules/database-driver/data-type/OffsetDateTime'
import {
    RemoveCatalogSchemaMutation
} from '../../../src/modules/database-driver/request-response/schema/mutation/engine/RemoveCatalogSchemaMutation'
import {
    ModifyCatalogSchemaNameMutation
} from '../../../src/modules/database-driver/request-response/schema/mutation/engine/ModifyCatalogSchemaNameMutation'
import {
    CreateCatalogSchemaMutation
} from '../../../src/modules/database-driver/request-response/schema/mutation/engine/CreateCatalogSchemaMutation'
import {
    MarkCatalogMissingMutation
} from '../../../src/modules/database-driver/request-response/schema/mutation/engine/MarkCatalogMissingMutation'
import {
    UpgradeCatalogFormatMutation
} from '../../../src/modules/database-driver/request-response/schema/mutation/engine/UpgradeCatalogFormatMutation'
import {
    TransactionMutation
} from '../../../src/modules/database-driver/request-response/transaction/TransactionMutation'
import type { SchemaMutation } from '../../../src/modules/database-driver/request-response/schema/mutation/SchemaMutation'
import {
    ModifyCatalogSchemaMutation
} from '../../../src/modules/database-driver/request-response/schema/mutation/engine/ModifyCatalogSchemaMutation'
import {
    ModifyCatalogSchemaConflictResolutionMutation
} from '../../../src/modules/database-driver/request-response/schema/mutation/catalog/ModifyCatalogSchemaConflictResolutionMutation'
import {
    UnknownSchemaMutation
} from '../../../src/modules/database-driver/request-response/schema/mutation/UnknownSchemaMutation'
import { List as ImmutableList } from 'immutable'

// --- response builders -------------------------------------------------------

function ack(millisToNextHeartbeat = 1000): RegisterSystemChangeCaptureResponse {
    return new RegisterSystemChangeCaptureResponse(
        undefined,
        CaptureResponseType.Acknowledgement,
        undefined,
        new HeartBeat(0, undefined, 0, millisToNextHeartbeat)
    )
}

function heartbeat(lastObservedVersion: number): RegisterSystemChangeCaptureResponse {
    return new RegisterSystemChangeCaptureResponse(
        undefined,
        CaptureResponseType.Heartbeat,
        undefined,
        new HeartBeat(0, undefined, lastObservedVersion, 1000)
    )
}

function change(version: number, body: SchemaMutation | undefined): RegisterSystemChangeCaptureResponse {
    const timestamp = new OffsetDateTime(new Timestamp(1_700_000_000n, 0), 'Z')
    return new RegisterSystemChangeCaptureResponse(
        undefined,
        CaptureResponseType.Change,
        new ChangeSystemCapture(version, 0, Operation.Upsert, body, timestamp),
        undefined
    )
}

// --- scripted stub client ----------------------------------------------------

type Attempt = (signal: AbortSignal) => AsyncGenerator<RegisterSystemChangeCaptureResponse>

/** A generator that yields the given responses then blocks until the stream is aborted. */
function yieldThenBlock(responses: RegisterSystemChangeCaptureResponse[]): Attempt {
    return async function* (signal: AbortSignal) {
        for (const response of responses) {
            yield response
        }
        await new Promise<void>((_, reject) => {
            signal.addEventListener('abort', () => reject(new Error('aborted')))
        })
    }
}

/** A generator that yields the given responses then throws (simulating a stream error). */
function yieldThenThrow(responses: RegisterSystemChangeCaptureResponse[]): Attempt {
    return async function* () {
        for (const response of responses) {
            yield response
        }
        throw new Error('stream error')
    }
}

/** A generator that yields the given responses then completes (server closed the stream). */
function yieldThenComplete(responses: RegisterSystemChangeCaptureResponse[]): Attempt {
    return async function* () {
        for (const response of responses) {
            yield response
        }
    }
}

interface StubClient {
    evitaClient: EvitaClient
    registerSystemChangeCapture: ReturnType<typeof vi.fn>
    clearSchemaCache: ReturnType<typeof vi.fn>
    clearCatalogStatisticsCache: ReturnType<typeof vi.fn>
    resetRevalidationState: ReturnType<typeof vi.fn>
}

function makeClient(attempts: Attempt[]): StubClient {
    const clearSchemaCache = vi.fn(async () => {})
    const clearCatalogStatisticsCache = vi.fn(async () => {})
    let index = 0
    const blockForever: Attempt = yieldThenBlock([])
    const registerSystemChangeCapture = vi.fn((options: { signal: AbortSignal }) => {
        const attempt: Attempt = attempts[index] ?? blockForever
        index++
        return attempt(options.signal)
    })
    const resetRevalidationState = vi.fn(() => {})
    const evitaClient = {
        registerSystemChangeCapture,
        clearSchemaCache,
        management: { clearCatalogStatisticsCache },
        persistentCacheLayer: { resetRevalidationState }
    } as unknown as EvitaClient
    return {
        evitaClient,
        registerSystemChangeCapture,
        clearSchemaCache,
        clearCatalogStatisticsCache,
        resetRevalidationState
    }
}

describe('DataCacheRefresher', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.spyOn(console, 'warn').mockImplementation(() => {})
    })
    afterEach(() => {
        vi.restoreAllMocks()
        vi.useRealTimers()
    })

    test('start() is idempotent — a second call does not open a second stream', async () => {
        const stub = makeClient([yieldThenBlock([ack()])])
        const refresher = new DataCacheRefresher(stub.evitaClient)

        refresher.start()
        refresher.start()
        await vi.advanceTimersByTimeAsync(1)

        expect(stub.registerSystemChangeCapture).toHaveBeenCalledTimes(1)
        expect(refresher.streamStatus.value).toBe(ChangeStreamStatus.UpToDate)
        refresher.stop()
    })

    test('a first connect does not re-verify the persisted cache', async () => {
        const stub = makeClient([yieldThenBlock([ack()])])
        const refresher = new DataCacheRefresher(stub.evitaClient)

        refresher.start()
        await vi.advanceTimersByTimeAsync(1)

        // nothing could have changed unobserved yet — re-verifying every persisted value on the very first
        // acknowledgement would fire a pointless burst of refreshes on every startup
        expect(stub.resetRevalidationState).not.toHaveBeenCalled()
        refresher.stop()
    })

    test('a genuine reconnect re-verifies the persisted cache', async () => {
        const stub = makeClient([
            yieldThenThrow([]),
            yieldThenBlock([ack()])
        ])
        const refresher = new DataCacheRefresher(stub.evitaClient)

        refresher.start()
        await vi.advanceTimersByTimeAsync(1)
        expect(refresher.streamStatus.value).toBe(ChangeStreamStatus.Broken)
        expect(stub.resetRevalidationState).not.toHaveBeenCalled()

        // the stream was Broken and is acknowledged again: data may well have changed while evitaLab could
        // not observe it, so everything restored from disk is due for another verification
        await vi.advanceTimersByTimeAsync(5_000)

        expect(refresher.streamStatus.value).toBe(ChangeStreamStatus.UpToDate)
        expect(stub.resetRevalidationState).toHaveBeenCalledTimes(1)
        refresher.stop()
    })

    test('acknowledgement flips the status to UpToDate', async () => {
        const stub = makeClient([yieldThenBlock([ack()])])
        const refresher = new DataCacheRefresher(stub.evitaClient)

        refresher.start()
        await vi.advanceTimersByTimeAsync(1)

        expect(refresher.streamStatus.value).toBe(ChangeStreamStatus.UpToDate)
        refresher.stop()
    })

    test('reconnects with backoff after a stream error, returning to UpToDate', async () => {
        const stub = makeClient([
            yieldThenThrow([]),
            yieldThenBlock([ack()])
        ])
        const refresher = new DataCacheRefresher(stub.evitaClient)

        refresher.start()
        await vi.advanceTimersByTimeAsync(1)
        // first attempt errored → Broken, waiting on the 5s backoff
        expect(refresher.streamStatus.value).toBe(ChangeStreamStatus.Broken)
        expect(stub.registerSystemChangeCapture).toHaveBeenCalledTimes(1)

        await vi.advanceTimersByTimeAsync(5_000)
        expect(stub.registerSystemChangeCapture).toHaveBeenCalledTimes(2)
        expect(refresher.streamStatus.value).toBe(ChangeStreamStatus.UpToDate)
        refresher.stop()
    })

    test('reconnects after the server closes the stream normally', async () => {
        const stub = makeClient([
            yieldThenComplete([ack()]),
            yieldThenBlock([ack()])
        ])
        const refresher = new DataCacheRefresher(stub.evitaClient)

        refresher.start()
        await vi.advanceTimersByTimeAsync(1)
        // completed normally → treated as failure → Broken, backoff pending
        expect(refresher.streamStatus.value).toBe(ChangeStreamStatus.Broken)

        await vi.advanceTimersByTimeAsync(5_000)
        expect(stub.registerSystemChangeCapture).toHaveBeenCalledTimes(2)
        expect(refresher.streamStatus.value).toBe(ChangeStreamStatus.UpToDate)
        refresher.stop()
    })

    test('the heartbeat watchdog aborts a silent stream and triggers a reconnect', async () => {
        // advertise a 60s heartbeat interval so the watchdog is 2 * 60000 = 120000ms, independent of
        // the fallback floor
        const stub = makeClient([
            yieldThenBlock([ack(60_000)]),
            yieldThenBlock([ack(60_000)])
        ])
        const refresher = new DataCacheRefresher(stub.evitaClient)

        refresher.start()
        await vi.advanceTimersByTimeAsync(1)
        expect(stub.registerSystemChangeCapture).toHaveBeenCalledTimes(1)

        // just before the watchdog deadline the stream is still considered alive
        await vi.advanceTimersByTimeAsync(119_000)
        expect(refresher.streamStatus.value).toBe(ChangeStreamStatus.UpToDate)

        // watchdog fires at 120000ms, aborting the silent stream
        await vi.advanceTimersByTimeAsync(1_000)
        expect(refresher.streamStatus.value).toBe(ChangeStreamStatus.Broken)

        // then the backoff elapses and a fresh stream opens
        await vi.advanceTimersByTimeAsync(5_000)
        expect(stub.registerSystemChangeCapture).toHaveBeenCalledTimes(2)
        refresher.stop()
    })

    test('the watchdog falls back to the minimum floor when no heartbeat interval is advertised', async () => {
        // millisToNextHeartbeat = 0 -> watchdog uses the 30s floor
        const stub = makeClient([
            yieldThenBlock([ack(0)]),
            yieldThenBlock([ack(0)])
        ])
        const refresher = new DataCacheRefresher(stub.evitaClient)

        refresher.start()
        await vi.advanceTimersByTimeAsync(1)
        await vi.advanceTimersByTimeAsync(29_000)
        expect(refresher.streamStatus.value).toBe(ChangeStreamStatus.UpToDate)

        await vi.advanceTimersByTimeAsync(1_000)
        expect(refresher.streamStatus.value).toBe(ChangeStreamStatus.Broken)
        refresher.stop()
    })

    test('a change capture updates lastChangeAt', async () => {
        const stub = makeClient([yieldThenBlock([ack(), change(1, new CreateCatalogSchemaMutation('c'))])])
        const refresher = new DataCacheRefresher(stub.evitaClient)

        refresher.start()
        await vi.advanceTimersByTimeAsync(1)

        expect(refresher.lastChangeAt.value).toBeDefined()
        expect(refresher.lastChangeAt.value!.timestamp.seconds).toBe(1_700_000_000n)
        refresher.stop()
    })

    test('a create catalog mutation clears the catalog statistics cache', async () => {
        const stub = makeClient([yieldThenBlock([ack(), change(1, new CreateCatalogSchemaMutation('c'))])])
        const refresher = new DataCacheRefresher(stub.evitaClient)

        refresher.start()
        await vi.advanceTimersByTimeAsync(1)

        expect(stub.clearCatalogStatisticsCache).toHaveBeenCalledTimes(1)
        expect(stub.clearSchemaCache).not.toHaveBeenCalled()
        refresher.stop()
    })

    test('a remove catalog mutation clears both statistics and schema caches', async () => {
        const stub = makeClient([yieldThenBlock([ack(), change(1, new RemoveCatalogSchemaMutation('gone'))])])
        const refresher = new DataCacheRefresher(stub.evitaClient)

        refresher.start()
        await vi.advanceTimersByTimeAsync(1)

        expect(stub.clearCatalogStatisticsCache).toHaveBeenCalledTimes(1)
        expect(stub.clearSchemaCache).toHaveBeenCalledWith('gone')
        refresher.stop()
    })

    test('a rename catalog mutation clears the schema cache for both names', async () => {
        const stub = makeClient([
            yieldThenBlock([ack(), change(1, new ModifyCatalogSchemaNameMutation('old', 'new', false))])
        ])
        const refresher = new DataCacheRefresher(stub.evitaClient)

        refresher.start()
        await vi.advanceTimersByTimeAsync(1)

        expect(stub.clearSchemaCache).toHaveBeenCalledWith('old')
        expect(stub.clearSchemaCache).toHaveBeenCalledWith('new')
        refresher.stop()
    })

    test('a transaction mutation invalidates no caches', async () => {
        const txn = new TransactionMutation('id', 1, 1, 0, new OffsetDateTime(new Timestamp(1n, 0), 'Z'))
        const stub = makeClient([yieldThenBlock([ack(), change(1, txn)])])
        const refresher = new DataCacheRefresher(stub.evitaClient)

        refresher.start()
        await vi.advanceTimersByTimeAsync(1)

        expect(stub.clearCatalogStatisticsCache).not.toHaveBeenCalled()
        expect(stub.clearSchemaCache).not.toHaveBeenCalled()
        expect(refresher.lastChangeAt.value).toBeDefined()
        refresher.stop()
    })

    test('a mark-catalog-missing mutation clears both statistics and schema caches', async () => {
        const stub = makeClient([yieldThenBlock([ack(), change(1, new MarkCatalogMissingMutation('gone'))])])
        const refresher = new DataCacheRefresher(stub.evitaClient)

        refresher.start()
        await vi.advanceTimersByTimeAsync(1)

        expect(stub.clearCatalogStatisticsCache).toHaveBeenCalledTimes(1)
        expect(stub.clearSchemaCache).toHaveBeenCalledWith('gone')
        refresher.stop()
    })

    test('an upgrade-catalog-format mutation clears the catalog statistics cache', async () => {
        const stub = makeClient([yieldThenBlock([ack(), change(1, new UpgradeCatalogFormatMutation('legacy', 2, 3))])])
        const refresher = new DataCacheRefresher(stub.evitaClient)

        refresher.start()
        await vi.advanceTimersByTimeAsync(1)

        expect(stub.clearCatalogStatisticsCache).toHaveBeenCalledTimes(1)
        expect(stub.clearSchemaCache).not.toHaveBeenCalled()
        refresher.stop()
    })

    test('a modify catalog schema mutation clears the schema cache of that catalog', async () => {
        const stub = makeClient([yieldThenBlock([ack(), change(1, new ModifyCatalogSchemaMutation(
            'shop',
            undefined,
            ImmutableList([new ModifyCatalogSchemaConflictResolutionMutation(undefined)])
        ))])])
        const refresher = new DataCacheRefresher(stub.evitaClient)

        refresher.start()
        await vi.advanceTimersByTimeAsync(1)

        expect(stub.clearSchemaCache).toHaveBeenCalledWith('shop')
        expect(stub.clearCatalogStatisticsCache).toHaveBeenCalledTimes(1)
        refresher.stop()
    })

    test('a nested mutation the client cannot convert still evicts the schema cache', async () => {
        // eviction keys off the containing mutation's catalog name only, so an unknown nested mutation
        // (a newer server, or a missing registry entry) must not cost the refresh
        const stub = makeClient([yieldThenBlock([ack(), change(1, new ModifyCatalogSchemaMutation(
            'shop',
            undefined,
            ImmutableList([new UnknownSchemaMutation('aMutationFromANewerServer')])
        ))])])
        const refresher = new DataCacheRefresher(stub.evitaClient)

        refresher.start()
        await vi.advanceTimersByTimeAsync(1)

        expect(stub.clearSchemaCache).toHaveBeenCalledWith('shop')
        refresher.stop()
    })

    test('a header-only capture (unknown mutation) defensively clears the statistics cache but keeps the stream alive', async () => {
        const stub = makeClient([yieldThenBlock([ack(), change(1, undefined)])])
        const refresher = new DataCacheRefresher(stub.evitaClient)

        refresher.start()
        await vi.advanceTimersByTimeAsync(1)

        // the unknown mutation is tolerated: the stream stays up (no reconnect) and lastChangeAt advances
        expect(stub.registerSystemChangeCapture).toHaveBeenCalledTimes(1)
        expect(refresher.streamStatus.value).toBe(ChangeStreamStatus.UpToDate)
        expect(refresher.lastChangeAt.value).toBeDefined()
        // defensive invalidation: statistics cache cleared, schema cache left untouched (no catalog name)
        expect(stub.clearCatalogStatisticsCache).toHaveBeenCalledTimes(1)
        expect(stub.clearSchemaCache).not.toHaveBeenCalled()
        refresher.stop()
    })

    test('heartbeat and acknowledgement responses do not trigger the defensive statistics clear', async () => {
        const stub = makeClient([yieldThenBlock([ack(), heartbeat(3)])])
        const refresher = new DataCacheRefresher(stub.evitaClient)

        refresher.start()
        await vi.advanceTimersByTimeAsync(1)

        expect(stub.clearCatalogStatisticsCache).not.toHaveBeenCalled()
        expect(stub.clearSchemaCache).not.toHaveBeenCalled()
        refresher.stop()
    })

    test('resumes from the last observed version after a reconnect', async () => {
        const stub = makeClient([
            yieldThenThrow([ack(), heartbeat(17)]),
            yieldThenBlock([ack()])
        ])
        const refresher = new DataCacheRefresher(stub.evitaClient)

        refresher.start()
        await vi.advanceTimersByTimeAsync(1)
        await vi.advanceTimersByTimeAsync(5_000)

        expect(stub.registerSystemChangeCapture).toHaveBeenCalledTimes(2)
        // the second attempt resumes from version 17
        expect(stub.registerSystemChangeCapture.mock.calls[1]![0]).toMatchObject({ sinceVersion: 17n })
        refresher.stop()
    })

    test('keeps the resume point across a single pre-ack reconnect failure', async () => {
        const stub = makeClient([
            yieldThenThrow([ack(), heartbeat(17)]),
            yieldThenThrow([]),
            yieldThenBlock([ack()])
        ])
        const refresher = new DataCacheRefresher(stub.evitaClient)

        refresher.start()
        await vi.advanceTimersByTimeAsync(1)
        await vi.advanceTimersByTimeAsync(5_000)   // -> attempt 2 (pre-ack failure)
        await vi.advanceTimersByTimeAsync(10_000)  // -> attempt 3

        expect(stub.registerSystemChangeCapture).toHaveBeenCalledTimes(3)
        // resume point retained: attempt 3 still resumes from version 17, no defensive stats clear
        expect(stub.registerSystemChangeCapture.mock.calls[2]![0]).toMatchObject({ sinceVersion: 17n })
        expect(stub.clearCatalogStatisticsCache).not.toHaveBeenCalled()
        refresher.stop()
    })

    test('abandons the resume point and resyncs after repeated pre-ack failures', async () => {
        const stub = makeClient([
            yieldThenThrow([ack(), heartbeat(17)]),
            yieldThenThrow([]),
            yieldThenThrow([]),
            yieldThenThrow([]),
            yieldThenBlock([ack()])
        ])
        const refresher = new DataCacheRefresher(stub.evitaClient)

        refresher.start()
        await vi.advanceTimersByTimeAsync(1)
        await vi.advanceTimersByTimeAsync(5_000)   // attempt 2 (resumeAttemptFailures = 1)
        await vi.advanceTimersByTimeAsync(10_000)  // attempt 3 (= 2)
        await vi.advanceTimersByTimeAsync(20_000)  // attempt 4 (= 3 -> abandon + resync)
        await vi.advanceTimersByTimeAsync(60_000)  // attempt 5 (fresh subscription)

        expect(stub.registerSystemChangeCapture).toHaveBeenCalledTimes(5)
        expect(stub.registerSystemChangeCapture.mock.calls[4]![0]).toMatchObject({ sinceVersion: undefined })
        expect(stub.clearCatalogStatisticsCache).toHaveBeenCalledTimes(1)
        refresher.stop()
    })

    test('stop() aborts the stream and prevents further reconnects', async () => {
        const stub = makeClient([yieldThenBlock([ack()])])
        const refresher = new DataCacheRefresher(stub.evitaClient)

        refresher.start()
        await vi.advanceTimersByTimeAsync(1)
        refresher.stop()
        await vi.advanceTimersByTimeAsync(60_000)

        expect(stub.registerSystemChangeCapture).toHaveBeenCalledTimes(1)
    })
})
