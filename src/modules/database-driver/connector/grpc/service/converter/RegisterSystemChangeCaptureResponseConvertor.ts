//todo: lho
import type {
    RegisterSystemChangeCaptureResponse
} from '@/modules/database-driver/request-response/cdc/RegisterSystemChangeCaptureResponse.ts'
import {
    GrpcRegisterSystemChangeCaptureResponse
} from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaAPI_pb.ts'
import type {
    EvitaValueConverter
} from '@/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter.ts'
import type {
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
        return new RegisterSystemChangeCaptureResponse(
            this.evitaValueConverter.convertUuid(response.uuid),
            response.capture
        )
    }
}
