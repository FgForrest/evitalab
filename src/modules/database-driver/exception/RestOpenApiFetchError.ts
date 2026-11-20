import { LabError } from '@/modules/base/exception/LabError'

/**
 * Thrown when the server answers the request for a REST API OpenAPI specification with an error status. Carries
 * the error the server reported, so the user sees why the specification is unavailable.
 */
export class RestOpenApiFetchError extends LabError {
    readonly status: number
    readonly errorCode: string | undefined

    constructor(status: number, errorCode: string | undefined, serverMessage: string | undefined) {
        super(
            'RestOpenApiFetchError',
            `Could not fetch the OpenAPI specification (HTTP ${status})${serverMessage != undefined ? `: ${serverMessage}` : '.'}`,
            errorCode != undefined ? `Error code: ${errorCode}` : undefined
        )
        this.status = status
        this.errorCode = errorCode
    }
}
