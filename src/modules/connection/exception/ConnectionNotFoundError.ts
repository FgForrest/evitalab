import { LabError } from '@/modules/base/exception/LabError'
import { ConnectionId } from '@/modules/connection/model/ConnectionId'

/**
 * Thrown when requested connection by ID could not be found in storage
 */
export class ConnectionNotFoundError extends LabError {

    readonly connectionId: ConnectionId

    constructor(connectionId: ConnectionId) {
        super(
            'ConnectionNotFoundError',
            `Could not found connection '${connectionId}'.`
        )
        this.connectionId = connectionId
    }
}
