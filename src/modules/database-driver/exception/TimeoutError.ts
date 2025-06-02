import { Connection } from '@/modules/connection/model/Connection'
import { LabError } from '@/modules/base/exception/LabError'

/**
 * Thrown when request to evitaDB took too long.
 */
// todo lho use the connection
export class TimeoutError extends LabError {
    constructor(connection: Connection | undefined) {
        super(
            'TimeoutError',
            `Request timed out. Please check your settings of connection '${connection?.name || '<unknown>'}'.`
        )
    }
}
