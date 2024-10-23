import { LabError } from '@/modules/base/exception/LabError'
import { Connection } from '@/modules/connection/model/Connection'

/**
 * Could not connect to the server (evitaDB instance). We can't do anything about it.
 */
// todo lho use the connection
export class EvitaDBInstanceNetworkError extends LabError {
    constructor(connection: Connection | undefined) {
        super(
            'EvitaDBInstanceNetworkError',
            `Could not connect to the '${connection?.name || 'unknown'}' instance. Please check your connection settings.`
        )
    }
}
