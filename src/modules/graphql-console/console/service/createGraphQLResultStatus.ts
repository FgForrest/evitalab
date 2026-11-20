import { i18n } from '@/vue-plugins/i18n'
import { ConsoleResultStatus } from '@/modules/console/result-status/model/ConsoleResultStatus'
import type { GraphQLResponse } from '@/modules/database-driver/connector/gql/model/GraphQLResponse'

/**
 * Summarizes a GraphQL response for the result status bar: `OK`, or the number of entries of its `errors` array
 * (a GraphQL server answers errors with 200), the measured duration, and the size of the response.
 *
 * @param sizeBytes UTF-8 size of the compact response JSON, computed by the caller
 */
export function createGraphQLResultStatus(response: GraphQLResponse,
                                          durationMs: number,
                                          sizeBytes: number): ConsoleResultStatus {
    const errorCount: number = Array.isArray(response.errors) ? response.errors.length : 0
    return new ConsoleResultStatus(
        errorCount === 0,
        errorCount === 0
            ? i18n.global.t('resultStatus.ok')
            : i18n.global.t('resultStatus.errors', { count: errorCount }, errorCount),
        durationMs,
        sizeBytes
    )
}
