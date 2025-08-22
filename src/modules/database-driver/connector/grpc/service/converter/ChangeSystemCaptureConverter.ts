//todo: lho
import {
    GrpcChangeCaptureOperation,
    type GrpcChangeSystemCapture
} from '@/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb.ts'
import { ChangeSystemCapture } from '@/modules/database-driver/request-response/cdc/ChangeSystemCapture.ts'
import { ChangeCaptureOperation } from '@/modules/database-driver/request-response/cdc/ChangeCaptureOperation.ts'
import type {
    EngineMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/EngineMutationConverter.ts'

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
            this.engineMutationConverter.convertEngineMutation(capture.systemMutation)
        )
    }

    convertChangeCaptureOperation(operation: GrpcChangeCaptureOperation): ChangeCaptureOperation {
        switch (operation) {
            case GrpcChangeCaptureOperation.REMOVE:
                return ChangeCaptureOperation.Remove
            case GrpcChangeCaptureOperation.UPSERT:
                return ChangeCaptureOperation.Upsert
            case GrpcChangeCaptureOperation.TRANSACTION:
                return ChangeCaptureOperation.Transaction
        }
    }
}
