import type { Uuid } from '@/modules/database-driver/data-type/Uuid.ts'
import type { ChangeSystemCapture } from '@/modules/database-driver/request-response/cdc/ChangeSystemCapture.ts'
import type { CaptureResponseType } from '@/modules/database-driver/request-response/cdc/CaptureResponseType.ts'

export class RegisterSystemChangeCaptureResponse {
    /** Identification of the registered capture */
    readonly uuid: Uuid
    /** The capture payload matching the criteria */
    readonly capture?: ChangeSystemCapture
    /** Type of the response: acknowledgement or change */
    readonly responseType: CaptureResponseType

    constructor(responseType: CaptureResponseType, uuid: Uuid, capture?: ChangeSystemCapture) {
        this.uuid = uuid
        this.capture = capture
        this.responseType = responseType
    }
}
