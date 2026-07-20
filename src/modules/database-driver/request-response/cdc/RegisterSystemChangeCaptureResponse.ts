import type { Uuid } from '@/modules/database-driver/data-type/Uuid.ts'
import type { CaptureResponseType } from '@/modules/database-driver/request-response/cdc/CaptureResponseType.ts'
import type { ChangeSystemCapture } from '@/modules/database-driver/request-response/cdc/ChangeSystemCapture.ts'
import type { HeartBeat } from '@/modules/database-driver/request-response/cdc/HeartBeat.ts'

/**
 * Internal counterpart of the gRPC `GrpcRegisterSystemChangeCaptureResponse`. A single message
 * received on a system change-capture stream. Depending on {@link responseType} it carries either a
 * {@link capture} (a change) or a {@link heartBeat} (acknowledgement / heartbeat).
 */
export class RegisterSystemChangeCaptureResponse {
    /** Identification of the registered capture (present on the acknowledgement). */
    readonly uuid: Uuid | undefined
    /** The type of the response. */
    readonly responseType: CaptureResponseType
    /** The captured change event (present only when {@link responseType} is `Change`). */
    readonly capture: ChangeSystemCapture | undefined
    /** Heartbeat information (present only for acknowledgement and heartbeat responses). */
    readonly heartBeat: HeartBeat | undefined

    constructor(
        uuid: Uuid | undefined,
        responseType: CaptureResponseType,
        capture: ChangeSystemCapture | undefined,
        heartBeat: HeartBeat | undefined
    ) {
        this.uuid = uuid
        this.responseType = responseType
        this.capture = capture
        this.heartBeat = heartBeat
    }
}
