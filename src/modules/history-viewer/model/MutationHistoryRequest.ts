import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime.ts'
import {
    GrpcChangeCaptureContainerType,
    GrpcChangeCaptureOperation
} from '@/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb.ts'

export class MutationHistoryRequest {
    readonly from?: OffsetDateTime
    readonly to?: OffsetDateTime
    readonly operationList: GrpcChangeCaptureOperation[]
    readonly containerNameList: string[]
    readonly containerTypeList: GrpcChangeCaptureContainerType[]
    readonly entityPrimaryKey: number | undefined
    readonly entityType: string | undefined
    readonly infrastructureAreaType: 'DATA_SITE' | 'SCHEMA_SITE' | undefined
    readonly sinceVersion: number | undefined
    readonly sinceIndex: number | undefined
    readonly page: number | undefined
    readonly loadTransaction?: boolean = true

    constructor(
        from: OffsetDateTime | undefined,
        to: OffsetDateTime | undefined,
        operationList: GrpcChangeCaptureOperation[] | undefined,
        containerNameList: string[] | undefined,
        containerTypeList: GrpcChangeCaptureContainerType[] | undefined,
        entityPrimaryKey: number | undefined,
        entityType: string | undefined,
        infrastructureAreaType?: 'DATA_SITE' | 'SCHEMA_SITE',
        sinceVersion?: number,
        sinceIndex?: number,
        page?: number,
        loadTransaction?: boolean
    ) {
        this.from = from
        this.to = to
        this.operationList = operationList && operationList.length > 0 ? this.toMutationType(operationList) : []
        this.containerNameList = containerNameList ?? []
        this.containerTypeList = containerTypeList && containerTypeList.length > 0 ? this.toContainerType(containerTypeList) : [GrpcChangeCaptureContainerType.CONTAINER_ENTITY]
        this.entityPrimaryKey = entityPrimaryKey
        this.entityType = entityType
        this.infrastructureAreaType = infrastructureAreaType
        this.sinceVersion = sinceVersion
        this.sinceIndex = sinceIndex
        this.page = page
        this.loadTransaction = loadTransaction ?? true
    }

    // todo : fix me
    toContainerType(input: GrpcChangeCaptureContainerType[]): GrpcChangeCaptureContainerType[] {
        return input.map(it => GrpcChangeCaptureContainerType[it.toString() as any])
    }

    // todo : fix me
    toMutationType(input: GrpcChangeCaptureOperation[]): GrpcChangeCaptureOperation[] {
        return input.map(it => GrpcChangeCaptureOperation[it.toString() as any])
    }
}
