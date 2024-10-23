import { Connection } from '@/modules/connection/model/Connection'
import { LabError } from '@/modules/base/exception/LabError'

/**
 * Error that is thrown when a query to evitaDB fails.
 */
export class QueryError extends LabError {
    readonly error: any

    constructor(connection: Connection, error: any) {
        super(
            'QueryError',
            `Query error occurred in connection ${connection.name}`,
            error instanceof Array ? error.map(it => it.message).join('; ') : error.message
        )
        this.error = error
    }
}
