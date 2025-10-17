import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime.ts'
import { Uuid } from '@/modules/database-driver/data-type/Uuid.ts'
import {
    GrpcChangeCaptureContainerType,
    GrpcChangeCaptureOperation
} from '@/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb.ts'

/**
 * Mutable user criteria for mutation history filtering
 */
export class MutationHistoryCriteria {

    from?: OffsetDateTime
    to?: OffsetDateTime
    entityPrimaryKey?: number | undefined
    operationList?: GrpcChangeCaptureOperation[] | undefined
    containerNameList?: string[] | undefined
    containerTypeList?: GrpcChangeCaptureContainerType[] | undefined


    constructor(from?: OffsetDateTime,
                to?: OffsetDateTime,
                entityPrimaryKey?: number | undefined,
                operationList?: GrpcChangeCaptureOperation[] | undefined,
                containerNameList?: string[] | undefined,
                containerTypeList?: GrpcChangeCaptureContainerType[] | undefined) {
        this.from = from
        this.to = to
        this.entityPrimaryKey = entityPrimaryKey
        this.operationList = operationList ?? []
        this.containerNameList = containerNameList ?? []
        this.containerTypeList = containerTypeList ?? [GrpcChangeCaptureContainerType.CONTAINER_ENTITY]
    }
}
