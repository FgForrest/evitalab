import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { Map as ImmutableMap } from 'immutable'
import { TrafficRecord } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecord'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import type { Mutation } from '@/modules/database-driver/request-response/Mutation.ts'

/**
 * Generic context for record preparation before visualisation
 */
export class MutationHistoryPreparationContext {

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

    requestAdditionalSourceQueryRecord(sourceQueryId: string, before: Mutation): void {
        if (!this.visitedSourceQueryRecordsIndex.includes(sourceQueryId) &&
            !this.requestedAdditionalSourceQueryRecords.has(sourceQueryId)) {
            this.requestedAdditionalSourceQueryRecords.set(
                sourceQueryId,
                new RequestedSourceQueryRecord(sourceQueryId, before)
            )
        }
    }

    getRequestedAdditionalSourceQueryRecords(): ImmutableMap<string, RequestedSourceQueryRecord> {
        return ImmutableMap(this.requestedAdditionalSourceQueryRecords)
    }

    sessionStartRecordVisited(sessionId: Uuid): void {
        const serializedSessionId: string = sessionId.toString()
        if (this.visitedSessionStartRecordsIndex.includes(serializedSessionId)) {
            throw new UnexpectedError(`Session start record with ID '${sessionId}' already visited. This is weird.`)
        }
        this.visitedSessionStartRecordsIndex.push(serializedSessionId)
    }

    requestAdditionalSessionStartRecord(sessionId: Uuid, before: Mutation): void {
        const serializedSessionId: string = sessionId.toString()
        if (!this.visitedSessionStartRecordsIndex.includes(serializedSessionId) &&
            !this.requestedAdditionalSessionStartRecords.has(serializedSessionId)) {
            this.requestedAdditionalSessionStartRecords.set(
                serializedSessionId,
                new RequestedSessionStartRecord(sessionId, before)
            )
        }
    }

    getRequestedAdditionalSessionStartRecords(): ImmutableMap<string, RequestedSessionStartRecord> {
        return ImmutableMap(this.requestedAdditionalSessionStartRecords)
    }
}

export class RequestedSourceQueryRecord {
    readonly sourceQueryId: string
    readonly beforeRecord: Mutation

    constructor(sourceQueryId: string, beforeRecord: Mutation) {
        this.sourceQueryId = sourceQueryId
        this.beforeRecord = beforeRecord
    }
}

export class RequestedSessionStartRecord {
    readonly sessionId: Uuid
    readonly beforeRecord: Mutation

    constructor(sessionId: Uuid, beforeRecord: Mutation) {
        this.sessionId = sessionId
        this.beforeRecord = beforeRecord
    }
}
