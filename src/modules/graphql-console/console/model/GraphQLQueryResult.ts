import type { ConsoleResultStatus } from '@/modules/console/result-status/model/ConsoleResultStatus'

/**
 * Result of a query executed in the GraphQL console.
 */
export interface GraphQLQueryResult {
    /**
     * The response pretty-printed for the raw result view.
     */
    readonly resultJson: string
    readonly status: ConsoleResultStatus
}
