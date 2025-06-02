import { LabError } from '@/modules/base/exception/LabError'

/**
 * Error that is thrown when a query to evitaDB fails.
 */
export class QueryError extends LabError {
    readonly error: any

    constructor(error: any) {
        super(
            'QueryError',
            `Query error occurred`,
            error instanceof Array ? error.map(it => it.message).join('; ') : error.message
        )
        this.error = error
    }
}
