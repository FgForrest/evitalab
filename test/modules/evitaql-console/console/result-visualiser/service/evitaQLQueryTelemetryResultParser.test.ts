import { describe, expect, test } from 'vitest'
import { List as ImmutableList } from 'immutable'
import {
    EvitaQLQueryTelemetryResultParser
} from '@/modules/evitaql-console/console/result-visualiser/service/EvitaQLQueryTelemetryResultParser'
import {
    ParsedQueryTelemetry
} from '@/modules/console/result-visualiser/model/query-telemetry/QueryTelemetryParseResult'
import { EvitaResponse } from '@/modules/database-driver/request-response/data/EvitaResponse'
import { ExtraResults } from '@/modules/database-driver/request-response/data/ExtraResults'
import { QueryTelemetry } from '@/modules/database-driver/request-response/data/QueryTelemetry'
import { QueryPhase } from '@/modules/database-driver/request-response/data/QueryPhase'
import type { DataChunk } from '@/modules/database-driver/request-response/data/DataChunk'

function responseWith(extraResults: ExtraResults | undefined): EvitaResponse {
    return new EvitaResponse({} as unknown as DataChunk, extraResults, '{}')
}

function extraResultsWith(telemetry: QueryTelemetry | undefined): ExtraResults {
    return new ExtraResults(undefined, undefined, undefined, undefined, undefined, undefined, telemetry)
}

const parser: EvitaQLQueryTelemetryResultParser = new EvitaQLQueryTelemetryResultParser()

describe('evitaQL query telemetry result parser', () => {
    test('Should hand over the driver telemetry as a complete result', () => {
        const telemetry: QueryTelemetry = new QueryTelemetry(
            QueryPhase.Overall, 0n, 100n, 100n, ImmutableList(), undefined, undefined, undefined, ImmutableList()
        )

        const result = parser.parse(responseWith(extraResultsWith(telemetry)))

        expect(result).toBeInstanceOf(ParsedQueryTelemetry)
        expect((result as ParsedQueryTelemetry).telemetry).toBe(telemetry)
        expect((result as ParsedQueryTelemetry).missingSelections.isEmpty()).toBe(true)
    })

    test('Should return nothing when the response carries no telemetry', () => {
        expect(parser.parse(responseWith(undefined))).toBeUndefined()
        expect(parser.parse(responseWith(extraResultsWith(undefined)))).toBeUndefined()
    })
})
