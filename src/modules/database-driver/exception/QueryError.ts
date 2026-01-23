import { LabError } from '@/modules/base/exception/LabError'

/**
 * Error that is thrown when a query to evitaDB fails.
 */
interface ErrorWithMessage {
    message: string
}

function getErrorMessage(error: unknown): string {
    if (Array.isArray(error)) {
        return error.map(it => (it as ErrorWithMessage).message).join('; ')
    }
    if (error && typeof error === 'object' && 'message' in error) {
        return String((error as ErrorWithMessage).message)
    }
    return 'Unknown error'
}

export class QueryError extends LabError {
    readonly error: unknown

    constructor(error: unknown) {
        super(
            'QueryError',
            `Query error occurred`,
            getErrorMessage(error)
        )
        this.error = error
    }
}
