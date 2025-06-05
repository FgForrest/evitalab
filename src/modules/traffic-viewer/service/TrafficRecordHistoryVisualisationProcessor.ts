import { TrafficRecordVisualisationContext } from '@/modules/traffic-viewer/model/TrafficRecordVisualisationContext'
import { List as ImmutableList, Map as ImmutableMap } from 'immutable'
import { TrafficRecordVisualiser } from '@/modules/traffic-viewer/service/TrafficRecordVisualiser'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { TrafficRecordHistoryCriteria } from '@/modules/traffic-viewer/model/TrafficRecordHistoryCriteria'
import {
    RequestedSessionStartRecord,
    RequestedSourceQueryRecord,
    TrafficRecordPreparationContext
} from '@/modules/traffic-viewer/model/TrafficRecordPreparationContext'
import {
    TrafficRecordVisualisationDefinition
} from '@/modules/traffic-viewer/model/TrafficRecordVisualisationDefinition'
import { UserTrafficRecordType } from '@/modules/traffic-viewer/model/UserTrafficRecordType'
import { TrafficRecordType } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecordType'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { TrafficRecord } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecord'
import {
    TrafficRecordingCaptureRequest
} from '@/modules/database-driver/request-response/traffic-recording/TrafficRecordingCaptureRequest'
import { TrafficRecordContent } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecordContent'
import { Label, labelSourceQuery } from '@/modules/database-driver/request-response/traffic-recording/Label'
import {
    SessionStartContainer
} from '@/modules/database-driver/request-response/traffic-recording/SessionStartContainer'
import { SourceQueryContainer } from '@/modules/database-driver/request-response/traffic-recording/SourceQueryContainer'
import {
    SourceQueryStatisticsContainer
} from '@/modules/database-driver/request-response/traffic-recording/SourceQueryStatisticsContainer'

const additionSessionStartFetchRequestTypes: any = ImmutableList([TrafficRecordType.SessionStart])
const additionSourceQueryFetchRequestTypes: any = ImmutableList([TrafficRecordType.SourceQuery, TrafficRecordType.SourceQueryStatistics])

/**
 * Takes raw flat traffic records from server and processes them into visualisable tree structure.
 */
export class TrafficRecordHistoryVisualisationProcessor {

    private readonly evitaClient: EvitaClient
    private readonly visualisers: ImmutableList<TrafficRecordVisualiser<any>>

    constructor(evitaClient: EvitaClient, visualisers: ImmutableList<TrafficRecordVisualiser<any>>) {
        this.evitaClient = evitaClient
        this.visualisers = visualisers
    }

    async process(catalogName: string,
                  historyCriteria: TrafficRecordHistoryCriteria,
                  records: TrafficRecord[]): Promise<ImmutableList<TrafficRecordVisualisationDefinition>> {
        const preparationContext: TrafficRecordPreparationContext = new TrafficRecordPreparationContext()
        for (const record of records) {
            this.prepareRecord(preparationContext, record)
        }

        const recordsToVisualise: TrafficRecord[] = await this.processPreparedData(
            preparationContext,
            catalogName,
            historyCriteria,
            records
        )

        const visualisationContext: TrafficRecordVisualisationContext = new TrafficRecordVisualisationContext(catalogName)
        for (const record of recordsToVisualise) {
            this.visualiseRecord(visualisationContext, record)
        }
        return visualisationContext.getVisualisedRecords()
    }

    private async processPreparedData(preparationContext: TrafficRecordPreparationContext,
                                      catalogName: string,
                                      historyCriteria: TrafficRecordHistoryCriteria,
                                      records: TrafficRecord[]): Promise<TrafficRecord[]> {
        const recordsToVisualise: TrafficRecord[] = [...records]

        const requestedAdditionalSessionStartRecords: ImmutableMap<string, RequestedSessionStartRecord> =
            preparationContext.getRequestedAdditionalSessionStartRecords()
        if (!requestedAdditionalSessionStartRecords.isEmpty() && historyCriteria.types?.includes(UserTrafficRecordType.Session)) {
            const sessionStartFetchRequest: TrafficRecordingCaptureRequest = this.createAdditionalSessionStartFetchRequest(requestedAdditionalSessionStartRecords)
            const sessionStartRecords: ImmutableList<TrafficRecord> = await this.fetchAdditionalRecords(
                catalogName,
                sessionStartFetchRequest,
                recordsToVisualise.length  // this is not ideal, but don't have better solution right now
            )
            this.insertFetchedSessionStartRecords(sessionStartRecords, requestedAdditionalSessionStartRecords, recordsToVisualise)
        }

        const requestedAdditionalSourceQueryRecords: ImmutableMap<string, RequestedSourceQueryRecord> =
            preparationContext.getRequestedAdditionalSourceQueryRecords()
        if (!requestedAdditionalSourceQueryRecords.isEmpty() && historyCriteria.types?.includes(UserTrafficRecordType.SourceQuery)) {
            const sourceQueryFetchRequest: TrafficRecordingCaptureRequest = this.createAdditionalSourceQueryFetchRequest(requestedAdditionalSourceQueryRecords)
            const sourceQueryRecords: ImmutableList<TrafficRecord> = await this.fetchAdditionalRecords(
                catalogName,
                sourceQueryFetchRequest,
                recordsToVisualise.length * 2  // there are two record types we want to fetch... this is not ideal, but don't have better solution right now
            )
            this.insertFetchedSourceQueryRecords(sourceQueryRecords, requestedAdditionalSourceQueryRecords, recordsToVisualise)
        }

        return recordsToVisualise
    }

    private createAdditionalSessionStartFetchRequest(requestedSessionStartRecords: ImmutableMap<string, RequestedSessionStartRecord>): TrafficRecordingCaptureRequest {
        return new TrafficRecordingCaptureRequest(
            TrafficRecordContent.Body,
            undefined,
            undefined,
            undefined,
            additionSessionStartFetchRequestTypes,
            requestedSessionStartRecords
                .map(it => it.sessionId)
                .toList(),
            undefined,
            undefined,
            undefined
        )
    }

    private createAdditionalSourceQueryFetchRequest(requestedSourceQueryRecords: ImmutableMap<string, RequestedSourceQueryRecord>): TrafficRecordingCaptureRequest {
        return new TrafficRecordingCaptureRequest(
            TrafficRecordContent.Body,
            undefined,
            undefined,
            undefined,
            additionSourceQueryFetchRequestTypes,
            undefined,
            undefined,
            undefined,
            requestedSourceQueryRecords
                .map(it => new Label(
                    labelSourceQuery,
                    `'${it.sourceQueryId.toString()}'`
                ))
                .toList()
        )
    }

    private async fetchAdditionalRecords(catalogName: string,
                                         sourceQueryFetchRequest: TrafficRecordingCaptureRequest,
                                         limit: number): Promise<ImmutableList<TrafficRecord>> {
        return await this.evitaClient.queryCatalog(
            catalogName,
            session => session.getRecordings(
                sourceQueryFetchRequest,
                limit
            )
        )
    }

    private insertFetchedSessionStartRecords(additionalSessionStartRecords: ImmutableList<TrafficRecord>,
                                             requests: ImmutableMap<string, RequestedSessionStartRecord>,
                                             records: TrafficRecord[]): void {
        let startInsertingAt: number = 0
        for (const sessionStartRecord of additionalSessionStartRecords) {
            if (!(sessionStartRecord instanceof SessionStartContainer)) {
                throw new UnexpectedError(`Traffic record should be session start record.`)
            }
            const request: RequestedSessionStartRecord | undefined = requests.get(sessionStartRecord.sessionId.toString())
            if (request == undefined) {
                throw new UnexpectedError(`There is unexpected session start record for ID '${sessionStartRecord.sessionId.toString()}'`)
            }

            for (let i = startInsertingAt; i < records.length; i++) {
                const record: TrafficRecord = records[i]
                if (record == request.beforeRecord) {
                    records.splice(i, 0, sessionStartRecord)
                    startInsertingAt += 2 // we want to get pass the inserted and the "before" record as these are already processed
                    break
                }
            }
        }
    }

    private insertFetchedSourceQueryRecords(additionalSourceQueryRecords: ImmutableList<TrafficRecord>,
                                            requests: ImmutableMap<string, RequestedSourceQueryRecord>,
                                            records: TrafficRecord[]): void {
        for (const sourceQueryRecord of additionalSourceQueryRecords) {
            if (!(sourceQueryRecord instanceof SourceQueryContainer) && !(sourceQueryRecord instanceof SourceQueryStatisticsContainer)) {
                throw new UnexpectedError(`Traffic record should be source query record.`)
            }
            const request: RequestedSourceQueryRecord | undefined = requests.get(sourceQueryRecord.sourceQueryId.toString())
            if (request == undefined) {
                throw new UnexpectedError(`There is unexpected source query record for ID '${sourceQueryRecord.sourceQueryId.toString()}'`)
            }

            // we need to iterate of records again everytime because there may be statistics container somewhere in the back
            // that need to be matched to records next to the opening source query containers
            for (let i = 0; i < records.length; i++) {
                const record: TrafficRecord = records[i]
                if (record == request.beforeRecord) {
                    records.splice(i, 0, sourceQueryRecord)
                    break
                }
            }
        }
    }

    private prepareRecord(ctx: TrafficRecordPreparationContext, record: TrafficRecord): void {
        for (const visualiser of this.visualisers) {
            if (visualiser.canVisualise(record)) {
                visualiser.prepare(ctx, record)
                return
            }
        }
        throw new UnexpectedError(`No visualiser was found for '${record.type}'.`);
    }

    private visualiseRecord(ctx: TrafficRecordVisualisationContext, record: TrafficRecord): void {
        for (const visualiser of this.visualisers) {
            if (visualiser.canVisualise(record)) {
                visualiser.visualise(ctx, record)
                return
            }
        }
        throw new UnexpectedError(`No visualiser was found for '${record.type}'.`);
    }
}
