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

    transformError(e: any): Error {
        // todo lho rework
        if (e instanceof ConnectError) {
            return e
        } else if (e.name === 'HTTPError') {
            const statusCode: number = e.response.status
            if (statusCode >= 500) {
                return new EvitaDBInstanceServerError(this.connection)
            } else {
                return new UnexpectedError(e.message)
            }
        } else if (e.name === 'TimeoutError') {
            return new TimeoutError(this.connection)
        } else if (e.name === 'TypeError' && e.message === 'Failed to fetch') {
            return new EvitaDBInstanceNetworkError(this.connection)
        } else {
            return new UnexpectedError(e.message)
        }
    }
}
