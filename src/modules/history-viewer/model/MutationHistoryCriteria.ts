import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime.ts'
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
    entityPrimaryKey: number | undefined
    operationList: GrpcChangeCaptureOperation[] | undefined
    containerNameList: string[] | undefined
    containerTypeList: GrpcChangeCaptureContainerType[] | undefined
    entityType: string | undefined
    areaType: 'both' | 'dataSite' | 'schemaSite' | undefined
    mutableFilters: boolean | undefined


    constructor(from?: OffsetDateTime,
                to?: OffsetDateTime,
                entityPrimaryKey?: number  ,
                operationList?: GrpcChangeCaptureOperation[]  ,
                containerNameList?: string[]  ,
                containerTypeList?: GrpcChangeCaptureContainerType[]  ,
                entityType?: string  ,
                areaType: 'both' | 'dataSite' | 'schemaSite' = 'both',
                mutableFilters?: boolean
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
}
