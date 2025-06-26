import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { List as ImmutableList } from 'immutable'
import { TrafficRecord } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecord'
import { Duration } from 'luxon'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import { EvitaValueConverter } from '@/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter'
import type {
    GrpcQueryLabel,
    GrpcTrafficRecord,
    GrpcTrafficRecordingCaptureCriteria
} from '@/modules/database-driver/connector/grpc/gen/GrpcTrafficRecording_pb'
import { GrpcTrafficRecordingContent, GrpcTrafficRecordingType } from '@/modules/database-driver/connector/grpc/gen/GrpcTrafficRecording_pb'
import { MutationContainer } from '@/modules/database-driver/request-response/traffic-recording/MutationContainer'
import { QueryContainer } from '@/modules/database-driver/request-response/traffic-recording/QueryContainer'
import {
    EntityEnrichmentContainer
} from '@/modules/database-driver/request-response/traffic-recording/EntityEnrichmentContainer'
import { EntityFetchContainer } from '@/modules/database-driver/request-response/traffic-recording/EntityFetchContainer'
import {
    SessionCloseContainer
} from '@/modules/database-driver/request-response/traffic-recording/SessionCloseContainer'
import {
    SessionStartContainer
} from '@/modules/database-driver/request-response/traffic-recording/SessionStartContainer'
import { SourceQueryContainer } from '@/modules/database-driver/request-response/traffic-recording/SourceQueryContainer'
import {
    SourceQueryStatisticsContainer
} from '@/modules/database-driver/request-response/traffic-recording/SourceQueryStatisticsContainer'
import {
    TrafficRecordingCaptureRequest
} from '@/modules/database-driver/request-response/traffic-recording/TrafficRecordingCaptureRequest'
import { TrafficRecordContent } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecordContent'
import { TrafficRecordType } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecordType'
import { Label } from '@/modules/database-driver/request-response/traffic-recording/Label'

/**
 * Converter for converting evita traffic objects
 */
export class TrafficRecordingConverter {

    private readonly evitaValueConverter: EvitaValueConverter

    constructor(evitaValueConverter: EvitaValueConverter) {
        this.evitaValueConverter = evitaValueConverter
    }

    convertGrpcTrafficRecords(grpcTrafficRecords: GrpcTrafficRecord[]): ImmutableList<TrafficRecord> {
        const trafficRecords: TrafficRecord[] = []
        for (const grpcTrafficRecord of grpcTrafficRecords) {
            trafficRecords.push(this.convertGrpcTrafficRecord(grpcTrafficRecord))
        }
        return ImmutableList(trafficRecords)
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
                ImmutableList(grpcTrafficRecord.body.value.primaryKeys),
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
                BigInt(grpcTrafficRecord.body.value.catalogVersion),
                grpcTrafficRecord.body.value.trafficRecordCount,
                grpcTrafficRecord.body.value.queryCount,
                grpcTrafficRecord.body.value.entityFetchCount,
                grpcTrafficRecord.body.value.mutationCount
            );
            case 'sessionStart': return new SessionStartContainer(
                header.sessionSequenceOrder, header.sessionId, header.recordSessionOffset, header.sessionRecordsCount,
                header.type, header.created, header.duration, header.ioFetchedSizeBytes, header.ioFetchCount,
                header.finishedWithError,
                BigInt(grpcTrafficRecord.body.value.catalogVersion)
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
        return {
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
        } as GrpcTrafficRecordingCaptureCriteria
    }

    convertTrafficRecordContent(trafficRecordingContent: TrafficRecordContent): GrpcTrafficRecordingContent {
        switch (trafficRecordingContent) {
            case TrafficRecordContent.Header: return GrpcTrafficRecordingContent.TRAFFIC_RECORDING_HEADER
            case TrafficRecordContent.Body: return GrpcTrafficRecordingContent.TRAFFIC_RECORDING_BODY
            default:
                throw new UnexpectedError(`Unsupported traffic recording content '${trafficRecordingContent}'.`)
        }
    }

    convertTrafficRecordTypes(trafficRecordTypes: ImmutableList<TrafficRecordType>): GrpcTrafficRecordingType[] {
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

    convertLabels(labels: ImmutableList<Label>): GrpcQueryLabel[] {
        const grpcQueryLabels: GrpcQueryLabel[] = []
        for (const label of labels) {
            grpcQueryLabels.push(this.convertLabel(label))
        }
        return grpcQueryLabels
    }

    convertLabel(label: Label): GrpcQueryLabel {
        return {
            name: label.name,
            value: label.value
        } as GrpcQueryLabel
    }

    convertGrpcQueryLabels(grpcQueryLabels: GrpcQueryLabel[]): ImmutableList<Label> {
        const labels: Label[] = []
        for (const grpcQueryLabel of grpcQueryLabels) {
            labels.push(this.convertGrpcQueryLabel(grpcQueryLabel))
        }
        return ImmutableList(labels)
    }

    convertGrpcQueryLabel(grpcQueryLabel: GrpcQueryLabel): Label {
        return new Label(
            grpcQueryLabel.name,
            grpcQueryLabel.value
        )
    }

    private convertGrpcTrafficRecordHeader(grpcTrafficRecord: GrpcTrafficRecord): TrafficRecordHeader {
        return new TrafficRecordHeader(
            BigInt(grpcTrafficRecord.sessionSequenceOrder),
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
