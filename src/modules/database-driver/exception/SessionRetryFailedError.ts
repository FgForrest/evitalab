import { LabError } from '@/modules/base/exception/LabError'
import { errorMessage } from '@/utils/error'

/**
 * Thrown when a shared session of a catalog was closed underneath a running call and even the single
 * retry with a fresh session failed. The original failure is carried both in `cause` and in the message,
 * because the message is what survives the {@link ErrorTransformer} flattening on the way to the user.
 */
export class SessionRetryFailedError extends LabError {

    constructor(catalogName: string, cause: unknown) {
        super(
            'SessionRetryFailedError',
            `Could not execute the logic in a shared session of catalog '${catalogName}' even after a retry: ${errorMessage(cause)}`,
            errorMessage(cause)
        )
        this.cause = cause
    }
}
