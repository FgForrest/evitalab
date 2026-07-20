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
import type { SchemaMutation } from '@/modules/database-driver/request-response/schema/mutation/SchemaMutation.ts'

/**
 * Converts the gRPC `GrpcChangeSystemCapture` into its internal {@link ChangeSystemCapture} model,
 * delegating the engine-mutation body conversion to {@link DelegatingEngineMutationConverter}.
 *
 * This is a CDC-stream boundary: unknown or unconvertible bodies must never throw, or the poison
 * capture would propagate as a stream failure and be replayed on every reconnect. Any body the
 * client cannot convert (an opt-in host event, an unknown engine mutation, or an unexpected
 * converter throw) degrades to a header-only capture — the version/index/operation/timestamp are
 * always preserved so the stream can advance past the capture.
 */
export class ChangeSystemCaptureConverter {

    convertChangeSystemCapture(capture: GrpcChangeSystemCapture): ChangeSystemCapture {
        return new ChangeSystemCapture(
            Number(capture.version),
            capture.index,
            this.convertOperation(capture.operation),
            this.convertBody(capture),
            capture.timestamp != undefined
                ? EvitaValueConverter.convertGrpcOffsetDateTime(capture.timestamp)
                : undefined
        )
    }

    private convertBody(capture: GrpcChangeSystemCapture): SchemaMutation | undefined {
        const body = capture.body
        if (body.case === undefined) {
            // no body was requested, or proto3 dropped an unknown oneof branch — header-only capture
            return undefined
        }
        if (body.case !== 'systemMutation') {
            // host events (and any future body branch) are not modelled by the client — degrade
            console.warn(`Unsupported change-capture body '${body.case}'; degrading to header-only capture.`)
            return undefined
        }
        try {
            return DelegatingEngineMutationConverter.convert(body.value)
        } catch (e) {
            // last-resort net: a bug in a registered converter must not poison the CDC stream
            console.warn('Failed to convert engine mutation body; degrading to header-only capture.', e)
            return undefined
        }
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
                // CDC boundary: never throw on an unknown operation (version skew) — a throw would
                // poison the stream and replay on every reconnect; degrade instead
                console.warn(`Unknown change capture operation '${operation}'; degrading to Unknown.`)
                return Operation.Unknown
        }
    }
}
