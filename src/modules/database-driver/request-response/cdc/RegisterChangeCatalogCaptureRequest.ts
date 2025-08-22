/**
 * Request to register a catalog change capture.
 * String model equivalent of GrpcRegisterChangeCatalogCaptureRequest
 */
import type { ChangeCaptureCriteria } from '@/modules/database-driver/request-response/cdc/ChangeCaptureCriteria.ts'
import type { ChangeCaptureContent } from '@/modules/database-driver/request-response/cdc/ChangeCaptureContent.ts'

export class RegisterChangeCatalogCaptureRequest {
    /**
     * Starting point for the search (catalog version)
     */
    readonly sinceVersion?: bigint

    /**
     * Starting point for the search (index of the mutation within catalog version)
     */
    readonly sinceIndex?: number

    /**
     * The criteria of the capture, allows to define constraints on the returned mutations
     */
    readonly criteria: ChangeCaptureCriteria[]

    /**
     * The scope of the returned data - either header of the mutation, or the whole mutation
     */
    readonly content: ChangeCaptureContent

    constructor(
        content: ChangeCaptureContent,
        criteria: ChangeCaptureCriteria[] = [],
        sinceVersion?: bigint,
        sinceIndex?: number,
    ) {
        this.content = content
        this.criteria = criteria
        this.sinceVersion = sinceVersion
        this.sinceIndex = sinceIndex
    }
}
