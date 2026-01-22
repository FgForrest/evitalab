//todo: lho
import {
    GrpcChangeCaptureOperation,
    type GrpcChangeSystemCapture
} from '@/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb.ts'
import { ChangeSystemCapture } from '@/modules/database-driver/request-response/cdc/ChangeSystemCapture.ts'
import { Operation } from '@/modules/database-driver/request-response/cdc/Operation.ts'
import {
    type EngineMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/EngineMutationConverter.ts'
import { EvitaValueConverter } from '@/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter.ts'

export class ChangeSystemCaptureConverter {
    private readonly engineMutationConverter: EngineMutationConverter

    constructor(engineMutationConverter: EngineMutationConverter) {
        this.engineMutationConverter = engineMutationConverter
    }

    convertChangeSystemCapture(capture: GrpcChangeSystemCapture): ChangeSystemCapture {
        return new ChangeSystemCapture(
            capture.version,
            capture.index,
            this.convertChangeCaptureOperation(capture.operation),
            this.engineMutationConverter.convertEngineMutation(capture.systemMutation),
            capture.timestamp ? EvitaValueConverter.convertGrpcOffsetDateTime(capture.timestamp) : undefined
        )
    }

    convertChangeCaptureOperation(operation: GrpcChangeCaptureOperation): Operation {
        switch (operation) {
            case GrpcChangeCaptureOperation.REMOVE:
                return Operation.Remove
            case GrpcChangeCaptureOperation.UPSERT:
                return Operation.Upsert
            case GrpcChangeCaptureOperation.TRANSACTION:
                return Operation.Transaction
            default:
                throw new Error(`Unsupported operation type: ${operation}`)
        }
    }
}
