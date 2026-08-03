import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime.ts'
import {
    GrpcChangeCaptureContainerType,
    GrpcChangeCaptureOperation
} from '@/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb.ts'

/**
 * Named arguments of {@link MutationHistoryRequest}. The request is built from a large number of
 * optional, mostly same-typed values, so it is constructed from an options object rather than from a
 * positional argument list.
 */
export interface MutationHistoryRequestArgs {
    readonly from?: OffsetDateTime
    readonly to?: OffsetDateTime
    readonly operationList?: GrpcChangeCaptureOperation[]
    readonly containerNameList?: string[]
    readonly containerTypeList?: GrpcChangeCaptureContainerType[]
    readonly entityPrimaryKey?: number
    readonly entityType?: string
    readonly infrastructureAreaType?: 'DATA_SITE' | 'SCHEMA_SITE'
    readonly sinceVersion?: number
    readonly sinceIndex?: number
    readonly page?: number
    readonly loadTransaction?: boolean
    readonly newerThanVersion?: number
}

/**
 * Request for a single page of a catalog's mutation history.
 */
export class MutationHistoryRequest {
    readonly from?: OffsetDateTime
    readonly to?: OffsetDateTime
    readonly operationList: GrpcChangeCaptureOperation[]
    readonly containerNameList: string[]
    readonly containerTypeList: GrpcChangeCaptureContainerType[]
    readonly entityPrimaryKey: number | undefined
    readonly entityType: string | undefined
    readonly infrastructureAreaType: 'DATA_SITE' | 'SCHEMA_SITE' | undefined
    /**
     * Inclusive **upper** bound of the reverse scan — the catalog version the page starts at, walking
     * towards older versions. It is *not* a lower bound: the server clamps it to the current catalog
     * version and returns everything older, so it cannot express "only records newer than X"
     * (use {@link newerThanVersion} for that).
     */
    readonly sinceVersion: number | undefined
    /**
     * Index of the event within {@link sinceVersion} the reverse scan starts at. Must always be sent
     * together with {@link sinceVersion}: an unset value is read as `0` by the server, which in the
     * reverse direction skips every event of the anchor version except its transaction lead event.
     */
    readonly sinceIndex: number | undefined
    readonly page: number | undefined
    readonly loadTransaction: boolean
    /**
     * Exclusive **lower** bound on the catalog version — only records strictly newer than this version
     * are kept. Applied client-side by the driver; the mutation history API offers no such bound.
     */
    readonly newerThanVersion: number | undefined

    constructor(args: MutationHistoryRequestArgs) {
        this.from = args.from
        this.to = args.to
        this.operationList = args.operationList && args.operationList.length > 0 ? this.toMutationType(args.operationList) : []
        this.containerNameList = args.containerNameList ?? []
        this.containerTypeList = args.containerTypeList && args.containerTypeList.length > 0 ? this.toContainerType(args.containerTypeList) : [GrpcChangeCaptureContainerType.CONTAINER_ENTITY]
        this.entityPrimaryKey = args.entityPrimaryKey
        this.entityType = args.entityType
        this.infrastructureAreaType = args.infrastructureAreaType
        this.sinceVersion = args.sinceVersion
        this.sinceIndex = args.sinceIndex
        this.page = args.page
        this.loadTransaction = args.loadTransaction ?? true
        this.newerThanVersion = args.newerThanVersion
    }

    toContainerType(input: (GrpcChangeCaptureContainerType | string)[]): GrpcChangeCaptureContainerType[] {
        return input.map(it => typeof it === 'string' ? GrpcChangeCaptureContainerType[it as keyof typeof GrpcChangeCaptureContainerType] : it)
    }

    toMutationType(input: (GrpcChangeCaptureOperation | string)[]): GrpcChangeCaptureOperation[] {
        return input.map(it => typeof it === 'string' ? GrpcChangeCaptureOperation[it as keyof typeof GrpcChangeCaptureOperation] : it)
    }
}

/**
 * The value that must be sent as {@link MutationHistoryRequest.sinceIndex} to start a reverse scan at
 * the newest event of the anchor version (`Integer.MAX_VALUE` on the server side).
 */
export const reverseScanStartIndex: number = 2147483647
