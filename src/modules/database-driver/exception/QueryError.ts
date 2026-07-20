import { LabError } from '@/modules/base/exception/LabError'

/**
 * Error that is thrown when a query to evitaDB fails.
 */
export class QueryError extends LabError {
    readonly error: unknown

    constructor(error: unknown) {
        super(
            'QueryError',
            `Query error occurred`,
            Array.isArray(error)
                ? error.map(it => String((it as { message?: unknown }).message)).join('; ')
                : String((error as { message?: unknown }).message)
        )
        this.error = error
    }
}
