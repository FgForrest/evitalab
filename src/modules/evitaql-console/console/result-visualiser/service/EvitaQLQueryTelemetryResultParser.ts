import type { QueryTelemetryResultParser } from '@/modules/console/result-visualiser/service/QueryTelemetryResultParser'
import {
    ParsedQueryTelemetry,
    type QueryTelemetryParseResult
} from '@/modules/console/result-visualiser/model/query-telemetry/QueryTelemetryParseResult'
import { EvitaResponse } from '@/modules/database-driver/request-response/data/EvitaResponse'

/**
 * {@link QueryTelemetryResultParser} for EvitaQL query language. The driver has already converted the gRPC
 * telemetry into the internal model, which is always complete, so this only hands it over.
 */
export class EvitaQLQueryTelemetryResultParser implements QueryTelemetryResultParser<EvitaResponse> {

    parse(queryResult: EvitaResponse): QueryTelemetryParseResult | undefined {
        const telemetry = queryResult.extraResults?.queryTelemetry
        if (telemetry == undefined) {
            return undefined
        }
        return new ParsedQueryTelemetry(telemetry)
    }
}
