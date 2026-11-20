import type { EvitaResponse } from '@/modules/database-driver/request-response/data/EvitaResponse'
import type { ConsoleResultStatus } from '@/modules/console/result-status/model/ConsoleResultStatus'

/**
 * Result of a query executed in the evitaQL console.
 */
export interface EvitaQLQueryResult {
    /**
     * The response, or the error response of a query the server refused.
     */
    readonly response: EvitaResponse
    readonly status: ConsoleResultStatus
}
