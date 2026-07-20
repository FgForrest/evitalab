import {
    RegisterSystemChangeCaptureResponse
} from '@/modules/database-driver/request-response/cdc/RegisterSystemChangeCaptureResponse.ts'
import { CaptureResponseType } from '@/modules/database-driver/request-response/cdc/CaptureResponseType.ts'
import { HeartBeat } from '@/modules/database-driver/request-response/cdc/HeartBeat.ts'
import {
    GrpcCaptureResponseType,
    type GrpcHeartBeat
} from '@/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb.ts'
import type {
    GrpcRegisterSystemChangeCaptureResponse
} from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaAPI_pb.ts'
import { EvitaValueConverter } from '@/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter.ts'
import {
    ChangeSystemCaptureConverter
} from '@/modules/database-driver/connector/grpc/service/converter/ChangeSystemCaptureConverter.ts'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'

/**
 * Converts the gRPC `GrpcRegisterSystemChangeCaptureResponse` into its internal
 * {@link RegisterSystemChangeCaptureResponse} model.
 */
export class RegisterSystemChangeCaptureResponseConverter {
    private readonly changeSystemCaptureConverter: ChangeSystemCaptureConverter

    constructor(changeSystemCaptureConverter: ChangeSystemCaptureConverter) {
        this.changeSystemCaptureConverter = changeSystemCaptureConverter
    }

    convert(response: GrpcRegisterSystemChangeCaptureResponse): RegisterSystemChangeCaptureResponse {
        return new RegisterSystemChangeCaptureResponse(
            response.uuid != undefined
                ? EvitaValueConverter.convertGrpcUuid(response.uuid)
                : undefined,
            this.convertResponseType(response.responseType),
            response.capture != undefined
                ? this.changeSystemCaptureConverter.convertChangeSystemCapture(response.capture)
                : undefined,
            response.heartBeat != undefined
                ? this.convertHeartBeat(response.heartBeat)
                : undefined
        )
    }

    private convertResponseType(responseType: GrpcCaptureResponseType): CaptureResponseType {
        switch (responseType) {
            case GrpcCaptureResponseType.ACKNOWLEDGEMENT:
                return CaptureResponseType.Acknowledgement
            case GrpcCaptureResponseType.CHANGE:
                return CaptureResponseType.Change
            case GrpcCaptureResponseType.HEARTBEAT:
                return CaptureResponseType.Heartbeat
            default:
                throw new UnexpectedError('Unknown capture response type: ' + responseType)
        }
    }

    private convertHeartBeat(heartBeat: GrpcHeartBeat): HeartBeat {
        return new HeartBeat(
            Number(heartBeat.index),
            heartBeat.timestamp != undefined
                ? EvitaValueConverter.convertGrpcOffsetDateTime(heartBeat.timestamp)
                : undefined,
            Number(heartBeat.lastObservedVersion),
            Number(heartBeat.millisToNextHeartbeat)
        )
    }
}
