import { LabError } from '@/modules/base/exception/LabError'

/**
 * Unexpected error that should never happen. We don't know what happened.
 */
export class UnexpectedError extends LabError {
    constructor(detail: string) {
        super(
            'UnexpectedError',
            `Unexpected error occurred: ${detail}`,
            detail
        )
    }
}
