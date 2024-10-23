import { LabError } from '@/modules/base/exception/LabError'
import { Connection } from '@/modules/connection/model/Connection'

/**
 * Something went wrong with the server (evitaDB instance). We can't do anything about it.
 */
// todo lho use the connection
export class EvitaDBInstanceServerError extends LabError {
    constructor(connection: Connection | undefined) {
        super(
            'EvitaDBInstanceCallError',
            'Server error. Please check your evitaDB instance for more details.'
        )
    }
}
