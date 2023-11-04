import { EvitaDBConnection, LabError, UnexpectedError } from '@/model/lab'
import {
    EvitaDBInstanceNetworkError,
    EvitaDBInstanceServerError,
    TimeoutError
} from '@/model/lab'
import { KyInstance } from 'ky/distribution/types/ky'
import ky from 'ky'

/**
 * Common base for all API clients.
 */
export abstract class ApiClient {
    protected readonly httpClient: KyInstance

    constructor() {
        this.httpClient = ky.create({
            timeout: 300000 // 5 minutes
        })
    }

    /**
     * Translates HTTP errors into specific lab errors.
     */
    protected handleCallError(e: any, connection?: EvitaDBConnection): LabError {
        if (e.name === 'HTTPError') {
            const statusCode: number = e.response.status
            if (statusCode >= 500) {
                return new EvitaDBInstanceServerError(connection)
            } else {
                return new UnexpectedError(connection, e.message)
            }
        } else if (e.name === 'TimeoutError') {
            return new TimeoutError(connection)
        } else if (e.name === 'TypeError' && e.message === 'Failed to fetch') {
            return new EvitaDBInstanceNetworkError(connection)
        } else {
            return new UnexpectedError(connection, e.message)
        }
    }
}
