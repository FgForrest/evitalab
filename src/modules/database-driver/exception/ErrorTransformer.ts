import { errorMessage } from '@/utils/error'
import { Connection } from '@/modules/connection/model/Connection'
import { Code, ConnectError } from '@connectrpc/connect'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { EvitaDBInstanceServerError } from '@/modules/database-driver/exception/EvitaDBInstanceServerError'
import { TimeoutError } from '@/modules/database-driver/exception/TimeoutError'
import { EvitaDBInstanceNetworkError } from '@/modules/database-driver/exception/EvitaDBInstanceNetworkError'
import { isConnectivityError } from '@/modules/database-driver/exception/connectivityError'
import { markServerUnreachable } from '@/modules/database-driver/model/serverConnectivity'

/**
 * Transforms server error to client error
 */
export class ErrorTransformer {
    private readonly connection: Connection

    constructor(connection: Connection) {
        this.connection = connection
    }

    transformError(e: unknown): Error {
        // every driver failure passes through here, which makes this the one place that can tell the rest of
        // the application that evitaLab has gone offline. Classified on the **raw** error: the transformed one
        // loses the original shape on the HTTP paths.
        if (isConnectivityError(e)) {
            markServerUnreachable()
        }
        // todo lho rework
        if (e instanceof ConnectError) {
            // the two codes whose raw message ("[deadline_exceeded] the operation timed out") would otherwise
            // reach the user verbatim, because everything that renders a driver error - the toaster and the
            // tab loading screen alike - renders `message` as it is. Every other code is passed through
            // unchanged **on purpose**: `Code.Canceled` is the documented file-download cancellation contract,
            // `Code.InvalidArgument` drives the traffic/mutation history's specific error states and
            // `Code.Unauthenticated` is what `EvitaClient.executeInSharedSession` recognizes as a
            // server-dropped session, and all three are matched by callers *after* this transformation.
            if (e.code === Code.DeadlineExceeded) {
                return new TimeoutError(this.connection)
            }
            if (e.code === Code.Unavailable) {
                return new EvitaDBInstanceNetworkError(this.connection)
            }
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
