//todo: lho
import {
    RegisterSystemChangeCaptureResponse
} from '@/modules/database-driver/request-response/cdc/RegisterSystemChangeCaptureResponse.ts'
import type {
    GrpcRegisterSystemChangeCaptureResponse
} from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaAPI_pb.ts'
import  {
    EvitaValueConverter
} from '@/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter.ts'
import {
    ChangeSystemCaptureConverter
} from '@/modules/database-driver/connector/grpc/service/converter/ChangeSystemCaptureConverter.ts'

export class RegisterSystemChangeCaptureResponseConvertor {
    private readonly evitaValueConverter: EvitaValueConverter
    private readonly changeSystemCaptureConverter: ChangeSystemCaptureConverter
    constructor(evitaValueConverter: EvitaValueConverter, changeSystemCaptureConverter: ChangeSystemCaptureConverter) {
        this.evitaValueConverter = evitaValueConverter
        this.changeSystemCaptureConverter = changeSystemCaptureConverter
    }
    convertRegisterSystemChangeCaptureResponse(response: GrpcRegisterSystemChangeCaptureResponse): RegisterSystemChangeCaptureResponse {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        return new RegisterSystemChangeCaptureResponse(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            this.evitaValueConverter.convertUuid(response.uuid),
            response.capture ? this.changeSystemCaptureConverter.convertChangeSystemCapture(response.capture) : undefined
        )
    }
}
