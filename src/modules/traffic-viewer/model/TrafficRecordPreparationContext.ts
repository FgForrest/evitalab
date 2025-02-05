import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import Immutable from 'immutable'
import { TrafficRecord } from '@/modules/connection/model/traffic/TrafficRecord'
import { Uuid } from '@/modules/connection/model/data-type/Uuid'

/**
 * Generic context for record preparation before visualisation
 */
export class TrafficRecordPreparationContext {

    private visitedSourceQueryRecordsIndex: string[] = []
    private requestedAdditionalSourceQueryRecords: Map<string, RequestedSourceQueryRecord> = new Map()

    private visitedSessionStartRecordsIndex: string[] = []
    private requestedAdditionalSessionStartRecords: Map<string, RequestedSessionStartRecord> = new Map()

    sourceQueryRecordVisited(sourceQueryId: string): void {
        if (this.visitedSourceQueryRecordsIndex.includes(sourceQueryId)) {
            throw new UnexpectedError(`Source query record with ID '${sourceQueryId}' already visited. This is weird.`)
        }
        this.visitedSourceQueryRecordsIndex.push(sourceQueryId)
    }

    requestAdditionalSourceQueryRecord(sourceQueryId: string, before: TrafficRecord): void {
        if (!this.visitedSourceQueryRecordsIndex.includes(sourceQueryId) &&
            !this.requestedAdditionalSourceQueryRecords.has(sourceQueryId)) {
            this.requestedAdditionalSourceQueryRecords.set(
                sourceQueryId,
                new RequestedSourceQueryRecord(sourceQueryId, before)
            )
        }
    }

    getRequestedAdditionalSourceQueryRecords(): Immutable.Map<string, RequestedSourceQueryRecord> {
        return Immutable.Map(this.requestedAdditionalSourceQueryRecords)
    }

    sessionStartRecordVisited(sessionId: Uuid): void {
        const serializedSessionId: string = sessionId.toString()
        if (this.visitedSessionStartRecordsIndex.includes(serializedSessionId)) {
            throw new UnexpectedError(`Session start record with ID '${sessionId}' already visited. This is weird.`)
        }
        this.visitedSessionStartRecordsIndex.push(serializedSessionId)
    }

    requestAdditionalSessionStartRecord(sessionId: Uuid, before: TrafficRecord): void {
        const serializedSessionId: string = sessionId.toString()
        if (!this.visitedSessionStartRecordsIndex.includes(serializedSessionId) &&
            !this.requestedAdditionalSessionStartRecords.has(serializedSessionId)) {
            this.requestedAdditionalSessionStartRecords.set(
                serializedSessionId,
                new RequestedSessionStartRecord(sessionId, before)
            )
        }
    }

    getRequestedAdditionalSessionStartRecords(): Immutable.Map<string, RequestedSessionStartRecord> {
        return Immutable.Map(this.requestedAdditionalSessionStartRecords)
    }
}

export class RequestedSourceQueryRecord {
    readonly sourceQueryId: string
    readonly beforeRecord: TrafficRecord

    constructor(sourceQueryId: string, beforeRecord: TrafficRecord) {
        this.sourceQueryId = sourceQueryId
        this.beforeRecord = beforeRecord
    }
}

export class RequestedSessionStartRecord {
    readonly sessionId: Uuid
    readonly beforeRecord: TrafficRecord

    constructor(sessionId: Uuid, beforeRecord: TrafficRecord) {
        this.sessionId = sessionId
        this.beforeRecord = beforeRecord
    }
}
