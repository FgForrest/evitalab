/**
* Response to RegisterChangeCatalogCapture request.
* String model equivalent of GrpcRegisterChangeCatalogCaptureResponse
*/
import type { Uuid } from '@/modules/database-driver/data-type/Uuid.ts'
import type { CaptureResponseType } from '@/modules/database-driver/request-response/cdc/CaptureResponseType.ts'
import type { ChangeCatalogCapture } from '@/modules/database-driver/request-response/cdc/ChangeCatalogCapture.ts'

export class RegisterChangeCatalogCaptureResponse {
    /** Identification of the registered capture */
    readonly uuid: Uuid
    /** The capture payload matching the criteria */
    readonly capture?: ChangeCatalogCapture
    /** Type of the response: acknowledgement or change */
    readonly responseType: CaptureResponseType

    constructor(responseType: CaptureResponseType, uuid: Uuid, capture?: ChangeCatalogCapture) {
        this.uuid = uuid
        this.capture = capture
        this.responseType = responseType
    }
}
