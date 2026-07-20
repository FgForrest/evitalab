import { errorMessage } from '@/utils/error'
import { Connection } from '@/modules/connection/model/Connection'
import { ConnectError } from '@connectrpc/connect'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { EvitaDBInstanceServerError } from '@/modules/database-driver/exception/EvitaDBInstanceServerError'
import { TimeoutError } from '@/modules/database-driver/exception/TimeoutError'
import { EvitaDBInstanceNetworkError } from '@/modules/database-driver/exception/EvitaDBInstanceNetworkError'

/**
 * Transforms server error to client error
 */
export class ErrorTransformer {
    private readonly connection: Connection

    constructor(connection: Connection) {
        this.connection = connection
    }

    transformError(e: unknown): Error {
        // todo lho rework
        if (e instanceof ConnectError) {
            return e
        }
        const err = e as { name?: string, response?: { status?: number } }
        if (err.name === 'HTTPError') {
            const statusCode: number = err.response?.status ?? 0
            if (statusCode >= 500) {
                return new EvitaDBInstanceServerError(this.connection)
            } else {
                return new UnexpectedError(errorMessage(e))
            }
        } else if (err.name === 'TimeoutError') {
            return new TimeoutError(this.connection)
        } else if (err.name === 'TypeError' && errorMessage(e) === 'Failed to fetch') {
            return new EvitaDBInstanceNetworkError(this.connection)
        } else {
            return new UnexpectedError(errorMessage(e))
        }
    }
}
