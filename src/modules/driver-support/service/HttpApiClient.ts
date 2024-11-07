import { KyInstance } from 'ky/distribution/types/ky'
import ky from 'ky'
import { Connection } from '@/modules/connection/model/Connection'
import { LabError } from '@/modules/base/exception/LabError'
import { EvitaDBInstanceServerError } from '@/modules/driver-support/exception/EvitaDBInstanceServerError'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { TimeoutError } from '@/modules/connection/exception/TimeoutError'
import { EvitaDBInstanceNetworkError } from '@/modules/driver-support/exception/EvitaDBInstanceNetworkError'
import { EvitaLabConfig } from '@/modules/config/EvitaLabConfig'

/**
 * Common base for all HTTP API clients.
 */
export abstract class HttpApiClient {
    protected readonly httpClient: KyInstance

    protected readonly evitaLabConfig: EvitaLabConfig

    protected constructor(evitaLabConfig: EvitaLabConfig) {
        this.httpClient = ky.create({
            timeout: 300000 // 5 minutes
        })
        this.evitaLabConfig = evitaLabConfig
    }

    /**
     * Resolves value for header 'X-EvitaDB-ClientID' used to identify evitaLab in tracing
     * @protected
     */
    protected getClientIdHeaderValue(): string {
        return 'evitaLab-' + encodeURIComponent(this.evitaLabConfig.serverName)
    }

    /**
     * Translates HTTP errors into specific lab errors.
     */
    protected handleCallError(e: any, connection?: Connection): LabError {
        if (e.name === 'HTTPError') {
            const statusCode: number = e.response.status
            if (statusCode >= 500) {
                return new EvitaDBInstanceServerError(connection)
            } else {
                return new UnexpectedError(e.message)
            }
        } else if (e.name === 'TimeoutError') {
            return new TimeoutError(connection)
        } else if (e.name === 'TypeError' && e.message === 'Failed to fetch') {
            return new EvitaDBInstanceNetworkError(connection)
        } else {
            return new UnexpectedError(e.message)
        }
    }
}
