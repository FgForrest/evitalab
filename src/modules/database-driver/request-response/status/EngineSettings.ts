import type {
    ConflictResolution
} from '@/modules/database-driver/request-response/schema/ConflictResolution.ts'

/**
 * Curated subset of the engine configuration a client needs to reason about the behaviour of the server
 * it talks to. Unlike the full configuration it carries nothing sensitive and stays readable while the
 * engine runs in read-only mode.
 *
 * All values come from the server's configuration file and are therefore constant for the lifetime of the
 * server process - the client may cache them until it reconnects.
 */
export class EngineSettings {

    /**
     * Engine-wide default conflict resolution applied to a commit when neither the catalog schema nor the
     * entity schema declares its own - the base of the conflict-resolution precedence walk.
     */
    readonly conflictResolution: ConflictResolution
    /**
     * Whether the engine retains historical data, so queries and restores targeting a past point in time
     * are available at all.
     */
    readonly timeTravelEnabled: boolean
    /**
     * Whether clients may subscribe to change data capture streams.
     */
    readonly changeDataCaptureEnabled: boolean
    /**
     * Whether the server records client traffic, so recordings can be started, inspected and exported.
     */
    readonly trafficRecordingEnabled: boolean
    /**
     * Whether the engine caches computed query results. Affects latency only, never query results.
     */
    readonly queryCacheEnabled: boolean

    constructor(
        conflictResolution: ConflictResolution,
        timeTravelEnabled: boolean,
        changeDataCaptureEnabled: boolean,
        trafficRecordingEnabled: boolean,
        queryCacheEnabled: boolean
    ) {
        this.conflictResolution = conflictResolution
        this.timeTravelEnabled = timeTravelEnabled
        this.changeDataCaptureEnabled = changeDataCaptureEnabled
        this.trafficRecordingEnabled = trafficRecordingEnabled
        this.queryCacheEnabled = queryCacheEnabled
    }
}
