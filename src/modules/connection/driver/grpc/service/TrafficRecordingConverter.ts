import { TrafficRecordContent } from '@/modules/connection/model/traffic/TrafficRecordContent'
import {
    GrpcQueryLabel, GrpcTrafficRecord,
    GrpcTrafficRecordingCaptureCriteria,
    GrpcTrafficRecordingContent, GrpcTrafficRecordingType
} from '@/modules/connection/driver/grpc/gen/GrpcTrafficRecording_pb'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { TrafficRecordingCaptureRequest } from '@/modules/connection/model/traffic/TrafficRecordingCaptureRequest'
import { EvitaValueConverter } from '@/modules/connection/driver/grpc/service/EvitaValueConverter'
import { TrafficRecordType } from '@/modules/connection/model/traffic/TrafficRecordType'
import Immutable from 'immutable'
import { Label } from '@/modules/connection/model/traffic/Label'
import { TrafficRecord } from '@/modules/connection/model/traffic/TrafficRecord'
import { Duration } from 'luxon'
import { MutationContainer } from '@/modules/connection/model/traffic/MutationContainer'
import { QueryContainer } from '@/modules/connection/model/traffic/QueryContainer'
import { Uuid } from '@/modules/connection/model/data-type/Uuid'
import { OffsetDateTime } from '@/modules/connection/model/data-type/OffsetDateTime'
import { EntityEnrichmentContainer } from '@/modules/connection/model/traffic/EntityEnrichmentContainer'
import { EntityFetchContainer } from '@/modules/connection/model/traffic/EntityFetchContainer'
import { SessionCloseContainer } from '@/modules/connection/model/traffic/SessionCloseContainer'
import { SessionStartContainer } from '@/modules/connection/model/traffic/SessionStartContainer'
import { SourceQueryContainer } from '@/modules/connection/model/traffic/SourceQueryContainer'
import { SourceQueryStatisticsContainer } from '@/modules/connection/model/traffic/SourceQueryStatisticsContainer'

/**
 * Converter for converting evita traffic objects
 */
export class TrafficRecordingConverter {

    private readonly evitaValueConverter: EvitaValueConverter

    constructor(evitaValueConverter: EvitaValueConverter) {
        this.evitaValueConverter = evitaValueConverter
    }

    convertGrpcTrafficRecords(grpcTrafficRecords: GrpcTrafficRecord[]): Immutable.List<TrafficRecord> {
        const trafficRecords: TrafficRecord[] = []
        for (const grpcTrafficRecord of grpcTrafficRecords) {
            trafficRecords.push(this.convertGrpcTrafficRecord(grpcTrafficRecord))
        }
        return Immutable.List(trafficRecords)
    }

    convertGrpcTrafficRecord(grpcTrafficRecord: GrpcTrafficRecord): TrafficRecord {
        const header: TrafficRecordHeader = this.convertGrpcTrafficRecordHeader(grpcTrafficRecord)

        switch (grpcTrafficRecord.body.case) {
            case 'mutation': return new MutationContainer(
                header.sessionSequenceOrder, header.sessionId, header.recordSessionOffset, header.sessionRecordsCount,
                header.type, header.created, header.duration, header.ioFetchedSizeBytes, header.ioFetchCount,
                header.finishedWithError,
                grpcTrafficRecord.body.value.mutation //  todo lho serialize to json?
            );
            case 'query': return new QueryContainer(
                header.sessionSequenceOrder, header.sessionId, header.recordSessionOffset, header.sessionRecordsCount,
                header.type, header.created, header.duration, header.ioFetchedSizeBytes, header.ioFetchCount,
                header.finishedWithError,
                grpcTrafficRecord.body.value.queryDescription,
                grpcTrafficRecord.body.value.query,
                grpcTrafficRecord.body.value.totalRecordCount,
                Immutable.List(grpcTrafficRecord.body.value.primaryKeys),
                this.convertGrpcQueryLabels(grpcTrafficRecord.body.value.labels)
            );
            case 'enrichment': return new EntityEnrichmentContainer(
                header.sessionSequenceOrder, header.sessionId, header.recordSessionOffset, header.sessionRecordsCount,
                header.type, header.created, header.duration, header.ioFetchedSizeBytes, header.ioFetchCount,
                header.finishedWithError,
                grpcTrafficRecord.body.value.query,
                grpcTrafficRecord.body.value.primaryKey
            );
            case 'fetch': return new EntityFetchContainer(
                header.sessionSequenceOrder, header.sessionId, header.recordSessionOffset, header.sessionRecordsCount,
                header.type, header.created, header.duration, header.ioFetchedSizeBytes, header.ioFetchCount,
                header.finishedWithError,
                grpcTrafficRecord.body.value.query,
                grpcTrafficRecord.body.value.primaryKey
            );
            case 'sessionClose': return new SessionCloseContainer(
                header.sessionSequenceOrder, header.sessionId, header.recordSessionOffset, header.sessionRecordsCount,
                header.type, header.created, header.duration, header.ioFetchedSizeBytes, header.ioFetchCount,
                header.finishedWithError,
                grpcTrafficRecord.body.value.catalogVersion,
                grpcTrafficRecord.body.value.trafficRecordCount,
                grpcTrafficRecord.body.value.queryCount,
                grpcTrafficRecord.body.value.entityFetchCount,
                grpcTrafficRecord.body.value.mutationCount
            );
            case 'sessionStart': return new SessionStartContainer(
                header.sessionSequenceOrder, header.sessionId, header.recordSessionOffset, header.sessionRecordsCount,
                header.type, header.created, header.duration, header.ioFetchedSizeBytes, header.ioFetchCount,
                header.finishedWithError,
                grpcTrafficRecord.body.value.catalogVersion
            );
            case 'sourceQuery': return new SourceQueryContainer(
                header.sessionSequenceOrder, header.sessionId, header.recordSessionOffset, header.sessionRecordsCount,
                header.type, header.created, header.duration, header.ioFetchedSizeBytes, header.ioFetchCount,
                header.finishedWithError,
                this.evitaValueConverter.convertGrpcUuid(grpcTrafficRecord.body.value.sourceQueryId!),
                grpcTrafficRecord.body.value.sourceQuery,
                this.convertGrpcQueryLabels(grpcTrafficRecord.body.value.labels)
            );
            case 'sourceQueryStatistics': return new SourceQueryStatisticsContainer(
                header.sessionSequenceOrder, header.sessionId, header.recordSessionOffset, header.sessionRecordsCount,
                header.type, header.created, header.duration, header.ioFetchedSizeBytes, header.ioFetchCount,
                header.finishedWithError,
                this.evitaValueConverter.convertGrpcUuid(grpcTrafficRecord.body.value.sourceQueryId!),
                grpcTrafficRecord.body.value.returnedRecordCount,
                grpcTrafficRecord.body.value.totalRecordCount
            );
            default:
                throw new UnexpectedError(`Unsupported gRPC traffic record implementation '${grpcTrafficRecord.body.case}'.`);
        }
    }

    convertTrafficRecordingCaptureRequest(captureRequest: TrafficRecordingCaptureRequest): GrpcTrafficRecordingCaptureCriteria {
        return new GrpcTrafficRecordingCaptureCriteria({
            content: this.convertTrafficRecordContent(captureRequest.content),
            since: captureRequest.since != undefined
                ? this.evitaValueConverter.convertOffsetDateTime(captureRequest.since)
                : undefined,
            sinceSessionSequenceId: captureRequest.sinceSessionSequenceId,
            sinceRecordSessionOffset: captureRequest.sinceRecordSessionOffset,
            type: captureRequest.types != undefined
                ? this.convertTrafficRecordTypes(captureRequest.types)
                : undefined,
            sessionId: captureRequest.sessionIds != undefined
                ? captureRequest.sessionIds.toArray().map(uuid => this.evitaValueConverter.convertUuid(uuid))
                : [],
            longerThanMilliseconds: captureRequest.longerThan != undefined
                ? captureRequest.longerThan.toMillis()
                : undefined,
            fetchingMoreBytesThan: captureRequest.fetchingMoreBytesThan,
            labels: captureRequest.labels != undefined
                ? this.convertLabels(captureRequest.labels)
                : undefined
        })
    }

    convertTrafficRecordContent(trafficRecordingContent: TrafficRecordContent): GrpcTrafficRecordingContent {
        switch (trafficRecordingContent) {
            case TrafficRecordContent.Header: return GrpcTrafficRecordingContent.TRAFFIC_RECORDING_HEADER
            case TrafficRecordContent.Body: return GrpcTrafficRecordingContent.TRAFFIC_RECORDING_BODY
            default:
                throw new UnexpectedError(`Unsupported traffic recording content '${trafficRecordingContent}'.`)
        }
    }

    convertTrafficRecordTypes(trafficRecordTypes: Immutable.List<TrafficRecordType>): GrpcTrafficRecordingType[] {
        const grpcTrafficRecordingTypes: GrpcTrafficRecordingType[] = []
        for (const trafficRecordingType of trafficRecordTypes) {
            grpcTrafficRecordingTypes.push(this.convertTrafficRecordType(trafficRecordingType))
        }
        return grpcTrafficRecordingTypes
    }

    convertTrafficRecordType(trafficRecordType: TrafficRecordType): GrpcTrafficRecordingType {
        switch (trafficRecordType) {
            case TrafficRecordType.SessionStart: return GrpcTrafficRecordingType.TRAFFIC_RECORDING_SESSION_START
            case TrafficRecordType.SessionClose: return GrpcTrafficRecordingType.TRAFFIC_RECORDING_SESSION_FINISH
            case TrafficRecordType.SourceQuery: return GrpcTrafficRecordingType.TRAFFIC_RECORDING_SOURCE_QUERY
            case TrafficRecordType.SourceQueryStatistics: return GrpcTrafficRecordingType.TRAFFIC_RECORDING_SOURCE_QUERY_STATISTICS
            case TrafficRecordType.Query: return GrpcTrafficRecordingType.TRAFFIC_RECORDING_QUERY
            case TrafficRecordType.Fetch: return GrpcTrafficRecordingType.TRAFFIC_RECORDING_FETCH
            case TrafficRecordType.Enrichment: return GrpcTrafficRecordingType.TRAFFIC_RECORDING_ENRICHMENT
            case TrafficRecordType.Mutation: return GrpcTrafficRecordingType.TRAFFIC_RECORDING_MUTATION
            default:
                throw new UnexpectedError(`Unsupported traffic record type '${trafficRecordType}'.`)
        }
    }

    convertGrpcTrafficRecordType(grpcTrafficRecordType: GrpcTrafficRecordingType): TrafficRecordType {
        switch (grpcTrafficRecordType) {
            case GrpcTrafficRecordingType.TRAFFIC_RECORDING_SESSION_START: return TrafficRecordType.SessionStart
            case GrpcTrafficRecordingType.TRAFFIC_RECORDING_SESSION_FINISH: return TrafficRecordType.SessionClose
            case GrpcTrafficRecordingType.TRAFFIC_RECORDING_SOURCE_QUERY: return TrafficRecordType.SourceQuery
            case GrpcTrafficRecordingType.TRAFFIC_RECORDING_SOURCE_QUERY_STATISTICS: return TrafficRecordType.SourceQueryStatistics
            case GrpcTrafficRecordingType.TRAFFIC_RECORDING_QUERY: return TrafficRecordType.Query
            case GrpcTrafficRecordingType.TRAFFIC_RECORDING_FETCH: return TrafficRecordType.Fetch
            case GrpcTrafficRecordingType.TRAFFIC_RECORDING_ENRICHMENT: return TrafficRecordType.Enrichment
            case GrpcTrafficRecordingType.TRAFFIC_RECORDING_MUTATION: return TrafficRecordType.Mutation
            default:
                throw new UnexpectedError(`Unsupported gRPC traffic recording type '${grpcTrafficRecordType}'.`)
        }
    }

    convertLabels(labels: Immutable.List<Label>): GrpcQueryLabel[] {
        const grpcQueryLabels: GrpcQueryLabel[] = []
        for (const label of labels) {
            grpcQueryLabels.push(this.convertLabel(label))
        }
        return grpcQueryLabels
    }

    convertLabel(label: Label): GrpcQueryLabel {
        return new GrpcQueryLabel({
            name: label.name,
            value: label.value
        })
    }

    convertGrpcQueryLabels(grpcQueryLabels: GrpcQueryLabel[]): Immutable.List<Label> {
        const labels: Label[] = []
        for (const grpcQueryLabel of grpcQueryLabels) {
            labels.push(this.convertGrpcQueryLabel(grpcQueryLabel))
        }
        return Immutable.List(labels)
    }

    convertGrpcQueryLabel(grpcQueryLabel: GrpcQueryLabel): Label {
        return new Label(
            grpcQueryLabel.name,
            grpcQueryLabel.value
        )
    }

    private convertGrpcTrafficRecordHeader(grpcTrafficRecord: GrpcTrafficRecord): TrafficRecordHeader {
        return new TrafficRecordHeader(
            grpcTrafficRecord.sessionSequenceOrder,
            this.evitaValueConverter.convertGrpcUuid(grpcTrafficRecord.sessionId!),
            grpcTrafficRecord.recordSessionOffset,
            grpcTrafficRecord.sessionRecordsCount,
            this.convertGrpcTrafficRecordType(grpcTrafficRecord.type),
            this.evitaValueConverter.convertGrpcOffsetDateTime(grpcTrafficRecord.created!),
            Duration.fromMillis(grpcTrafficRecord.durationInMilliseconds),
            grpcTrafficRecord.ioFetchedSizeBytes,
            grpcTrafficRecord.ioFetchCount,
            grpcTrafficRecord.finishedWithError
        )
    }
}

/**
 * Temporary holder of converter common data of traffic record
 */
class TrafficRecordHeader {

    readonly sessionSequenceOrder: bigint
    readonly sessionId: Uuid
    readonly recordSessionOffset: number
    readonly sessionRecordsCount: number
    readonly type: TrafficRecordType
    readonly created: OffsetDateTime
    readonly duration: Duration
    readonly ioFetchedSizeBytes: number
    readonly ioFetchCount: number
    readonly finishedWithError?: string

    constructor(sessionSequenceOrder: bigint,
                sessionId: Uuid,
                recordSessionOffset: number,
                sessionRecordsCount: number,
                type: TrafficRecordType,
                created: OffsetDateTime,
                duration: Duration,
                ioFetchedSizeBytes: number,
                ioFetchCount: number,
                finishedWithError: string | undefined) {
        this.sessionSequenceOrder = sessionSequenceOrder
        this.sessionId = sessionId
        this.recordSessionOffset = recordSessionOffset
        this.sessionRecordsCount = sessionRecordsCount
        this.type = type
        this.created = created
        this.duration = duration
        this.ioFetchedSizeBytes = ioFetchedSizeBytes
        this.ioFetchCount = ioFetchCount
        this.finishedWithError = finishedWithError
    }
}
