import { LabError } from '@/modules/base/exception/LabError'

/**
 * Indicates that the user tried to create a connection with a name that already exists.
 */
export class DuplicateConnectionError extends LabError {

    constructor(name: string) {
        super(
            'DuplicateConnectionError',
            `Connection with name '${name}' already exists`
        )
    }
}
