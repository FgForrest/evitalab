import type { InjectionKey, Ref } from 'vue'
import { ref } from 'vue'
import { DateTime } from 'luxon'
import { mandatoryInject } from '@/utils/reactivity'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { ChangeStreamStatus } from '@/modules/database-driver/model/ChangeStreamStatus'
import { CacheInvalidationReason } from '@/modules/database-driver/cache/CacheInvalidationReason'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import { CaptureResponseType } from '@/modules/database-driver/request-response/cdc/CaptureResponseType'
import type {
    RegisterSystemChangeCaptureResponse
} from '@/modules/database-driver/request-response/cdc/RegisterSystemChangeCaptureResponse'
import type { ChangeSystemCapture } from '@/modules/database-driver/request-response/cdc/ChangeSystemCapture'
import {
    CreateCatalogSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/engine/CreateCatalogSchemaMutation'
import {
    DuplicateCatalogMutation
} from '@/modules/database-driver/request-response/schema/mutation/engine/DuplicateCatalogMutation'
import {
    RestoreCatalogSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/engine/RestoreCatalogSchemaMutation'
import {
    RemoveCatalogSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/engine/RemoveCatalogSchemaMutation'
import {
    ModifyCatalogSchemaNameMutation
} from '@/modules/database-driver/request-response/schema/mutation/engine/ModifyCatalogSchemaNameMutation'
import {
    ModifyCatalogSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/engine/ModifyCatalogSchemaMutation'
import {
    MakeCatalogAliveMutation
} from '@/modules/database-driver/request-response/schema/mutation/engine/MakeCatalogAliveMutation'
import {
    SetCatalogStateMutation
} from '@/modules/database-driver/request-response/schema/mutation/engine/SetCatalogStateMutation'
import {
    SetCatalogMutabilityMutation
} from '@/modules/database-driver/request-response/schema/mutation/engine/SetCatalogMutabilityMutation'
import {
    MarkCatalogMissingMutation
} from '@/modules/database-driver/request-response/schema/mutation/engine/MarkCatalogMissingMutation'
import {
    UpgradeCatalogFormatMutation
} from '@/modules/database-driver/request-response/schema/mutation/engine/UpgradeCatalogFormatMutation'

export const dataCacheRefresherInjectionKey: InjectionKey<DataCacheRefresher> = Symbol('DataCacheRefresher')

export function useDataCacheRefresher(): DataCacheRefresher {
    return mandatoryInject(dataCacheRefresherInjectionKey) as DataCacheRefresher
}

/** Reconnect backoff schedule in milliseconds (capped at the last value). */
const RECONNECT_BACKOFF_MS: number[] = [5_000, 10_000, 20_000, 60_000]
/**
 * Minimum heartbeat watchdog timeout used only when the server does not advertise a usable
 * `millisToNextHeartbeat`. When the server does advertise one, the watchdog is `2 × interval`, which
 * dominates this floor and resets on every message; this floor only bites for a silent stream that
 * never sends a heartbeat, which is exactly the zombie case the watchdog exists to catch.
 */
const MIN_HEARTBEAT_WATCHDOG_MS = 30_000
/**
 * Number of consecutive resume attempts that must fail before acknowledgement before the resume
 * point is abandoned (and the catalog list defensively resynced). A genuinely rejected resume point
 * fails every attempt and trips this threshold; a transient outage recovers and acknowledges first,
 * keeping the resume point so missed mutations still replay.
 */
const MAX_RESUME_ATTEMPTS = 3

/**
 * Keeps a single always-open system change-data-capture (CDC) stream to the connected evitaDB server
 * and invalidates evitaLab's client-side caches when engine-level mutations (catalog
 * create/drop/rename/state/schema changes) arrive. Cache invalidation goes through the same
 * `clearSchemaCache` / `clearCatalogStatisticsCache` entry points the UI already listens on, so the
 * explorer panel, schema viewers, consoles etc. refresh themselves without any extra plumbing.
 *
 * The stream is self-healing: creation failures never crash evitaLab (the stream loop swallows all
 * errors, flips the status to {@link ChangeStreamStatus.Broken} and retries with a capped backoff),
 * and a single sequential loop guarantees at most one stream is open at any time. A heartbeat
 * watchdog aborts zombie streams that neither error nor complete. There is no notification toast —
 * the status-bar indicator fed by {@link streamStatus} is the sole user-facing signal (the Toaster
 * is not yet available when this service is constructed during module registration).
 *
 * Self-echo note: mutations performed by evitaLab itself are echoed back through the stream; because
 * those operations already clear the relevant caches explicitly, the echoed invalidation is an
 * idempotent no-op.
 */
export class DataCacheRefresher {
    private readonly evitaClient: EvitaClient

    /** Current health of the CDC stream. */
    readonly streamStatus: Ref<ChangeStreamStatus> = ref(ChangeStreamStatus.Connecting)
    /** Timestamp of the last received change capture, if any. */
    readonly lastChangeAt: Ref<OffsetDateTime | undefined> = ref(undefined)

    private started = false
    private abortController: AbortController | undefined = undefined
    private heartbeatWatchdog: ReturnType<typeof setTimeout> | undefined = undefined
    private heartbeatIntervalMs = 0

    /** Last engine version observed (from changes and heartbeats), used to resume after an outage. */
    private resumeVersion: bigint | undefined = undefined

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
    }

    /**
     * Starts the single stream loop. Idempotent — subsequent calls are no-ops. Never awaits the loop
     * so it can never block module registration.
     */
    start(): void {
        if (this.started) {
            return
        }
        this.started = true
        void this.runStreamLoop()
    }

    /**
     * Stops the stream loop and aborts the active stream. Primarily useful for tests.
     */
    stop(): void {
        this.started = false
        this.clearHeartbeatWatchdog()
        this.abortController?.abort()
    }

    private async runStreamLoop(): Promise<void> {
        let consecutiveFailures = 0
        let resumeAttemptFailures = 0

        while (this.started) {
            const abortController = new AbortController()
            this.abortController = abortController
            let acknowledged = false

            try {
                if (this.streamStatus.value !== ChangeStreamStatus.Broken) {
                    this.streamStatus.value = ChangeStreamStatus.Connecting
                }

                for await (const response of this.evitaClient.registerSystemChangeCapture({
                    sinceVersion: this.resumeVersion,
                    signal: abortController.signal
                })) {
                    this.resetHeartbeatWatchdog(abortController, response)

                    switch (response.responseType) {
                        case CaptureResponseType.Acknowledgement:
                            acknowledged = true
                            consecutiveFailures = 0
                            resumeAttemptFailures = 0
                            if (this.streamStatus.value === ChangeStreamStatus.Broken) {
                                // a genuine reconnect (not the first connect, which starts from `Connecting`):
                                // data may well have changed while evitaLab could not observe it, so every
                                // persisted value is due for another verification on its next read
                                this.evitaClient.persistentCacheLayer.resetRevalidationState()
                            }
                            this.streamStatus.value = ChangeStreamStatus.UpToDate
                            if (response.heartBeat != undefined) {
                                this.rememberVersion(BigInt(response.heartBeat.lastObservedVersion))
                            }
                            break
                        case CaptureResponseType.Heartbeat:
                            this.streamStatus.value = ChangeStreamStatus.UpToDate
                            if (response.heartBeat != undefined) {
                                this.rememberVersion(BigInt(response.heartBeat.lastObservedVersion))
                            }
                            break
                        case CaptureResponseType.Change:
                            this.streamStatus.value = ChangeStreamStatus.UpToDate
                            if (response.capture != undefined) {
                                this.lastChangeAt.value = response.capture.timestamp
                                    ?? OffsetDateTime.fromDateTime(DateTime.now())
                                this.rememberVersion(BigInt(response.capture.version))
                                await this.invalidateFor(response.capture)
                            }
                            break
                    }
                }

                // the iterator completed normally = the server closed the stream; treat as a failure
                // so the normal reconnect path runs
                throw new Error('System change-capture stream closed by the server')
            } catch (e) {
                if (!this.started) {
                    break
                }
                this.streamStatus.value = ChangeStreamStatus.Broken
                // diagnosability only — no toast (see class docs)
                console.warn('System change-capture stream failed, reconnecting…', e)

                // a resume point that the server keeps rejecting fails before acknowledgement on every
                // attempt; a transient outage recovers and acknowledges first. Only after several
                // consecutive pre-ack failures do we treat the resume point as invalid, drop it and
                // defensively resync the catalog list — this preserves replay across brief outages.
                if (this.resumeVersion != undefined && !acknowledged) {
                    resumeAttemptFailures++
                    if (resumeAttemptFailures >= MAX_RESUME_ATTEMPTS) {
                        this.resumeVersion = undefined
                        resumeAttemptFailures = 0
                        try {
                            // we only know that changes may have been missed, not that anything did change,
                            // and the persisted listing is what an unreachable server is served from - so the
                            // disk copy stays and the revalidation of the next read verifies it
                            await this.evitaClient.management.clearCatalogStatisticsCache(CacheInvalidationReason.MemoryOnly)
                        } catch (clearError) {
                            console.warn('Failed to clear catalog statistics cache after a rejected resume', clearError)
                        }
                    }
                }

                const backoff: number = RECONNECT_BACKOFF_MS[
                    Math.min(consecutiveFailures, RECONNECT_BACKOFF_MS.length - 1)
                ] ?? RECONNECT_BACKOFF_MS[RECONNECT_BACKOFF_MS.length - 1]!
                consecutiveFailures++
                await this.delay(backoff)
            } finally {
                this.clearHeartbeatWatchdog()
            }
        }
    }

    /**
     * Invalidates the caches affected by a single change capture. Dispatch is by the concrete class
     * of the converted mutation body.
     *
     * A header-only capture (undefined body) reaching this method means the body could not be
     * converted — an unknown engine mutation or an opt-in host event the client dropped. Because the
     * client always requests full bodies, a header-only capture never occurs on the happy path, so
     * the catalog statistics cache is defensively cleared: the cache is lazy and cheap, and this
     * avoids stale state when the unknown mutation would have required invalidation. Schema caches
     * stay untouched — no catalog name is recoverable from an unknown mutation.
     */
    private async invalidateFor(capture: ChangeSystemCapture): Promise<void> {
        const body = capture.body
        if (body == undefined) {
            console.warn('Unknown change capture (header-only); defensively clearing catalog statistics cache.')
            await this.evitaClient.management.clearCatalogStatisticsCache(CacheInvalidationReason.ChangeEvidence)
            return
        }

        if (
            body instanceof CreateCatalogSchemaMutation ||
            body instanceof DuplicateCatalogMutation ||
            body instanceof RestoreCatalogSchemaMutation
        ) {
            await this.evitaClient.management.clearCatalogStatisticsCache(CacheInvalidationReason.ChangeEvidence)
        } else if (body instanceof RemoveCatalogSchemaMutation) {
            await this.evitaClient.management.clearCatalogStatisticsCache(CacheInvalidationReason.ChangeEvidence)
            await this.evitaClient.clearSchemaCache(body.catalogName)
        } else if (body instanceof MarkCatalogMissingMutation) {
            // catalog stays listed in MISSING state, but its schema is no longer servable
            await this.evitaClient.management.clearCatalogStatisticsCache(CacheInvalidationReason.ChangeEvidence)
            await this.evitaClient.clearSchemaCache(body.catalogName)
        } else if (body instanceof ModifyCatalogSchemaNameMutation) {
            await this.evitaClient.management.clearCatalogStatisticsCache(CacheInvalidationReason.ChangeEvidence)
            await this.evitaClient.clearSchemaCache(body.catalogName)
            await this.evitaClient.clearSchemaCache(body.newCatalogName)
        } else if (body instanceof ModifyCatalogSchemaMutation) {
            await this.evitaClient.clearSchemaCache(body.catalogName)
            await this.evitaClient.management.clearCatalogStatisticsCache(CacheInvalidationReason.ChangeEvidence)
        } else if (
            body instanceof MakeCatalogAliveMutation ||
            body instanceof SetCatalogStateMutation ||
            body instanceof SetCatalogMutabilityMutation ||
            body instanceof UpgradeCatalogFormatMutation
        ) {
            // UpgradeCatalogFormatMutation drives OUT_OF_DATE → BEING_UPGRADED → prior state; the
            // explorer picks up the state change from the refreshed statistics
            await this.evitaClient.management.clearCatalogStatisticsCache(CacheInvalidationReason.ChangeEvidence)
        }
        // TransactionMutation and any other mutation carry no catalog reference — nothing to invalidate
    }

    private rememberVersion(version: bigint): void {
        if (this.resumeVersion == undefined || version > this.resumeVersion) {
            this.resumeVersion = version
        }
    }

    private resetHeartbeatWatchdog(
        abortController: AbortController,
        response: RegisterSystemChangeCaptureResponse
    ): void {
        if (response.heartBeat != undefined && response.heartBeat.millisToNextHeartbeat > 0) {
            this.heartbeatIntervalMs = response.heartBeat.millisToNextHeartbeat
        }
        this.clearHeartbeatWatchdog()
        const timeout: number = Math.max(2 * this.heartbeatIntervalMs, MIN_HEARTBEAT_WATCHDOG_MS)
        this.heartbeatWatchdog = setTimeout(() => abortController.abort(), timeout)
    }

    private clearHeartbeatWatchdog(): void {
        if (this.heartbeatWatchdog != undefined) {
            clearTimeout(this.heartbeatWatchdog)
            this.heartbeatWatchdog = undefined
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }
}
