import type { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'
import { UserTrafficRecordType } from '@/modules/traffic-viewer/model/UserTrafficRecordType'
import { Label } from '@/modules/database-driver/request-response/traffic-recording/Label'
import {
    GrpcChangeCaptureContainerType,
    GrpcChangeCaptureOperation
} from '@/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb.ts'

export interface MutationHistoryViewerTabDataDto extends TabDataDto {

    readonly from?: { seconds: string, nanos: number, offset: string }
    readonly to?: { seconds: string, nanos: number, offset: string }
    readonly entityPrimaryKey?: number,
    readonly operationList?: GrpcChangeCaptureOperation[] | undefined
    readonly containerNameList?: string[] | undefined
    readonly containerTypeList?: GrpcChangeCaptureContainerType[] | undefined
    readonly entityType?: string | undefined
    readonly areaType?: 'both' | 'dataSite' | 'schemaSite'
}
