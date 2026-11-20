import { i18n } from '@/vue-plugins/i18n'
import { ConsoleResultStatus } from '@/modules/console/result-status/model/ConsoleResultStatus'

/**
 * Summarizes an evitaQL execution for the result status bar: `OK`, or `Error` for a query the server refused, and
 * the measured duration. The size is unknown — the gRPC payload is not available to the console.
 */
export function createEvitaQLResultStatus(successful: boolean, durationMs: number): ConsoleResultStatus {
    return new ConsoleResultStatus(
        successful,
        i18n.global.t(successful ? 'resultStatus.ok' : 'resultStatus.error'),
        durationMs
    )
}
