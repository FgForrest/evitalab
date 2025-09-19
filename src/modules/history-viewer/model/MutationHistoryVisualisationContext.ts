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

    private rootVisualisedRecords: MutationHistoryItemVisualisationDefinition[] = []
    private visualisedSessionRecordsIndex: Map<string, MutationHistoryItemVisualisationDefinition> = new Map()
    private visualisedSourceQueryRecordsIndex: Map<string, MutationHistoryItemVisualisationDefinition> = new Map()

    constructor(catalogName: string) {
        this.catalogName = catalogName
    }

    getVisualisedRecords(): ImmutableList<MutationHistoryItemVisualisationDefinition> {
        return ImmutableList(this.rootVisualisedRecords)
    }

    addRootVisualisedRecord(record: MutationHistoryItemVisualisationDefinition): void {
        this.rootVisualisedRecords.push(record)
    }

    getVisualisedSessionRecord(sessionId: number): MutationHistoryItemVisualisationDefinition | undefined {
        return this.visualisedSessionRecordsIndex.get(sessionId.toString())
    }

    addVisualisedSessionRecord(sessionId: number, record: MutationHistoryItemVisualisationDefinition): void {
        if (this.visualisedSessionRecordsIndex.has(sessionId.toString())) {
            throw new UnexpectedError(`There is already session record with session ID '${sessionId.toString()}'`)
        }
        this.visualisedSessionRecordsIndex.set(sessionId.toString(), record)
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
