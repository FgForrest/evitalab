import type { TabData } from '@/modules/workspace/tab/model/TabData'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import type { MutationHistoryViewerTabDataDto } from '@/modules/history-viewer/model/MutationHistoryViewerTabDataDto.ts'
import {
    GrpcChangeCaptureContainerType,
    GrpcChangeCaptureOperation
} from '@/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb.ts'

export class MutationHistoryViewerTabData implements TabData<MutationHistoryViewerTabDataDto> {

    readonly from?: OffsetDateTime
    readonly to?: OffsetDateTime
    readonly entityPrimaryKey?: number | undefined
    readonly operationList?: GrpcChangeCaptureOperation[] | undefined
    readonly containerNameList?: string[] | undefined
    readonly containerTypeList?: GrpcChangeCaptureContainerType[] | undefined
    readonly entityType?: string | undefined
    readonly areaType?: 'both' | 'dataSite' | 'schemaSite'
    readonly mutableFilters?: boolean = true

    constructor(from?: OffsetDateTime,
                to?: OffsetDateTime,
                entityPrimaryKey?: number | undefined,
                operationList?: GrpcChangeCaptureOperation[] | undefined,
                containerNameList?: string[] | undefined,
                containerTypeList?: GrpcChangeCaptureContainerType[] | undefined,
                entityType?: string | undefined,
                areaType: 'both' | 'dataSite' | 'schemaSite' = 'both',
                mutableFilters: boolean = true
    ) {
        this.from = from
        this.to = to
        this.entityPrimaryKey = entityPrimaryKey
        this.operationList = operationList ?? []
        this.containerNameList = containerNameList ?? []
        this.containerTypeList = containerTypeList ?? []
        this.entityType = entityType
        this.areaType = areaType
        this.mutableFilters = mutableFilters
    }

    toSerializable(): MutationHistoryViewerTabDataDto {
        return {
            from: this.from != undefined
                ? {
                    seconds: String(this.from.timestamp.seconds),
                    nanos: this.from.timestamp.nanos,
                    offset: this.from.offset
                }
                : undefined,
            to: this.to != undefined
                ? {
                    seconds: String(this.to.timestamp.seconds),
                    nanos: this.to.timestamp.nanos,
                    offset: this.to.offset
                }
                : undefined,
            entityPrimaryKey: this.entityPrimaryKey,
            operationList: this.operationList,
            containerNameList: this.containerNameList,
            containerTypeList: this.containerTypeList,
            entityType: this.entityType,
            areaType: this.areaType,
            mutableFilters: this.mutableFilters
        }
    }
}
