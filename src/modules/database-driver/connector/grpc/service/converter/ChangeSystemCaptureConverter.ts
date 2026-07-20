import {
    GrpcChangeCaptureOperation,
    type GrpcChangeSystemCapture
} from '@/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb.ts'
import { ChangeSystemCapture } from '@/modules/database-driver/request-response/cdc/ChangeSystemCapture.ts'
import { Operation } from '@/modules/database-driver/request-response/cdc/Operation.ts'
import {
    DelegatingEngineMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/DelegatingEngineMutationConverter.ts'
import { EvitaValueConverter } from '@/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter.ts'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'

/**
 * Converts the gRPC `GrpcChangeSystemCapture` into its internal {@link ChangeSystemCapture} model,
 * delegating the engine-mutation body conversion to {@link DelegatingEngineMutationConverter}.
 */
export class ChangeSystemCaptureConverter {

    convertChangeSystemCapture(capture: GrpcChangeSystemCapture): ChangeSystemCapture {
        return new ChangeSystemCapture(
            Number(capture.version),
            capture.index,
            this.convertOperation(capture.operation),
            capture.systemMutation != undefined
                ? DelegatingEngineMutationConverter.convert(capture.systemMutation)
                : undefined,
            capture.timestamp != undefined
                ? EvitaValueConverter.convertGrpcOffsetDateTime(capture.timestamp)
                : undefined
        )
    }

    private convertOperation(operation: GrpcChangeCaptureOperation): Operation {
        switch (operation) {
            case GrpcChangeCaptureOperation.UPSERT:
                return Operation.Upsert
            case GrpcChangeCaptureOperation.REMOVE:
                return Operation.Remove
            case GrpcChangeCaptureOperation.TRANSACTION:
                return Operation.Transaction
            default:
                throw new UnexpectedError('Unknown change capture operation: ' + operation)
        }
    }
}
