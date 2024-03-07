import { EvitaDBConnection, LabError, UnexpectedError } from '@/model/lab'
import {
    EvitaDBInstanceNetworkError,
    EvitaDBInstanceServerError,
    TimeoutError
} from '@/model/lab'
import { KyInstance } from 'ky/distribution/types/ky'
import ky from 'ky'
import { store } from '@/store'

/**
 * Common base for all API clients.
 */
export abstract class ApiClient {
    protected readonly httpClient: KyInstance
    protected readonly myStore = store

    constructor() {
        this.httpClient = ky.create({
            timeout: 300000 // 5 minutes
        })
    }

    /**
     * Resolves value for header 'X-EvitaDB-ClientID' used to identify evitaLab in tracing
     * @protected
     */
    protected getClientIdHeaderValue(): string {
        return 'evitaLab-' + encodeURIComponent(this.myStore.state.lab.serverName)
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
