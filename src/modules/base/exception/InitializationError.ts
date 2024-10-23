import { LabError } from '@/modules/base/exception/LabError'

/**
 * Error that occurs only because of incorrect internal state initialization.
 */
export class InitializationError extends LabError {
    constructor(detail: string) {
        super(
            'InitializationError',
            `Unexpected error occurred during initial initialization: ${detail}`,
            detail
        )
    }
}
