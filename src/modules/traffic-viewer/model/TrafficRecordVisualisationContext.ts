import { TrafficRecordHistoryDataPointer } from '@/modules/traffic-viewer/model/TrafficRecordHistoryDataPointer'
import {
    TrafficRecordVisualisationDefinition
} from '@/modules/traffic-viewer/model/TrafficRecordVisualisationDefinition'
import { Uuid } from '@/modules/connection/model/data-type/Uuid'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import Immutable from 'immutable'

/**
 * Generic context for record visualisation
 */
export class TrafficRecordVisualisationContext {

    readonly dataPointer: TrafficRecordHistoryDataPointer

    private rootVisualisedRecords: TrafficRecordVisualisationDefinition[] = []
    private visualisedSessionRecordsIndex: Map<string, TrafficRecordVisualisationDefinition> = new Map()
    private visualisedSourceQueryRecordsIndex: Map<string, TrafficRecordVisualisationDefinition> = new Map()

    constructor(dataPointer: TrafficRecordHistoryDataPointer) {
        this.dataPointer = dataPointer
    }

    getVisualisedRecords(): Immutable.List<TrafficRecordVisualisationDefinition> {
        return Immutable.List(this.rootVisualisedRecords)
    }

    addRootVisualisedRecord(record: TrafficRecordVisualisationDefinition): void {
        this.rootVisualisedRecords.push(record)
    }

    getVisualisedSessionRecord(sessionId: Uuid): TrafficRecordVisualisationDefinition | undefined {
        return this.visualisedSessionRecordsIndex.get(sessionId.toString())
    }

    addVisualisedSessionRecord(sessionId: Uuid, record: TrafficRecordVisualisationDefinition): void {
        if (this.visualisedSessionRecordsIndex.has(sessionId.toString())) {
            throw new UnexpectedError(`There is already session record with session ID '${sessionId.toString()}'`)
        }
        this.visualisedSessionRecordsIndex.set(sessionId.toString(), record)
    }

    getVisualisedSourceQueryRecord(sourceQueryId: string): TrafficRecordVisualisationDefinition | undefined {
        return this.visualisedSourceQueryRecordsIndex.get(sourceQueryId)
    }

    addVisualisedSourceQueryRecord(sourceQueryId: string, record: TrafficRecordVisualisationDefinition): void {
        if (this.visualisedSourceQueryRecordsIndex.has(sourceQueryId)) {
            throw new UnexpectedError(`There is already source query record with ID '${sourceQueryId}'`)
        }
        this.visualisedSourceQueryRecordsIndex.set(sourceQueryId, record)
    }
}
