import { TrafficRecordHistoryDataPointer } from '@/modules/traffic-viewer/model/TrafficRecordHistoryDataPointer'
import {
    TrafficRecordVisualisationDefinition
} from '@/modules/traffic-viewer/model/TrafficRecordVisualisationDefinition'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { List as ImmutableList } from 'immutable'
import type {
    MutationHistoryItemVisualisationDefinition
} from '@/modules/history-viewer/model/MutationHistoryItemVisualisationDefinition.ts'

/**
 * Generic context for record visualisation
 */
export class MutationHistoryVisualisationContext {

    readonly catalogName: string

    private rootVisualisedRecords: Map<string, MutationHistoryItemVisualisationDefinition> = new Map()
    private visualisedSessionRecordsIndex: Map<string, MutationHistoryItemVisualisationDefinition> = new Map()
    private visualisedSourceQueryRecordsIndex: Map<string, MutationHistoryItemVisualisationDefinition> = new Map()
    private pendingChildrenIndex: Map<string, MutationHistoryItemVisualisationDefinition[]> = new Map()

    constructor(catalogName: string) {
        this.catalogName = catalogName
    }

    getVisualisedRecords(): ImmutableList<MutationHistoryItemVisualisationDefinition> {
        const filtered = Array.from(this.rootVisualisedRecords.values())
            .filter(v => v.children.size > 0);

        return ImmutableList(filtered)
    }

    // todo pfi: consultation required
    addRootVisualisedRecord(record: MutationHistoryItemVisualisationDefinition): void {
        if (this.rootVisualisedRecords.has(record.source.version.toString())) {
            // throw new UnexpectedError(`There is already mutation history record with transaction ID '${sessionId.toString()}'`)
        } else {
            this.rootVisualisedRecords.set(record.source.version.toString(), record)
        }

    }

    getVisualisedSessionRecord(sessionId: number): MutationHistoryItemVisualisationDefinition | undefined {
        return this.visualisedSessionRecordsIndex.get(sessionId.toString())
    }

    addVisualisedSessionRecord(sessionId: number, record: MutationHistoryItemVisualisationDefinition): void {
        if (this.visualisedSessionRecordsIndex.has(sessionId.toString())) {
            // throw new UnexpectedError(`There is already mutation history record with transaction ID '${sessionId.toString()}'`)
        } else {
            this.visualisedSessionRecordsIndex.set(sessionId.toString(), record)
        }
    }

    addPendingChild(sessionId: number, record: MutationHistoryItemVisualisationDefinition): void {
        const key = sessionId.toString()
        const arr = this.pendingChildrenIndex.get(key) || []
        arr.push(record)
        this.pendingChildrenIndex.set(key, arr)
    }

    attachPendingChildren(sessionId: number, transactionRecord: MutationHistoryItemVisualisationDefinition): void {
        const key = sessionId.toString()
        const arr = this.pendingChildrenIndex.get(key)
        if (arr && arr.length > 0) {
            for (const child of arr) {
                transactionRecord.addChild(child)
            }
            this.pendingChildrenIndex.delete(key)
        }
    }

    getVisualisedSourceQueryRecord(sourceQueryId: string): MutationHistoryItemVisualisationDefinition | undefined {
        return this.visualisedSourceQueryRecordsIndex.get(sourceQueryId)
    }

    addVisualisedSourceQueryRecord(sourceQueryId: string, record: MutationHistoryItemVisualisationDefinition): void {
        if (this.visualisedSourceQueryRecordsIndex.has(sourceQueryId)) {
            throw new UnexpectedError(`There is already source query record with ID '${sourceQueryId}'`)
        }
        this.visualisedSourceQueryRecordsIndex.set(sourceQueryId, record)
    }
}
