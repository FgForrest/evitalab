import { describe, expect, test } from 'vitest'
import { List as ImmutableList } from 'immutable'
import {
    EvitaQLResultAnalyzer
} from '@/modules/evitaql-console/console/result-visualiser/service/EvitaQLResultAnalyzer'
import { VisualiserTypeType } from '@/modules/console/result-visualiser/model/VisualiserTypeType'
import type { AnalyzedResult } from '@/modules/console/result-visualiser/model/AnalyzedResult'
import { EvitaResponse } from '@/modules/database-driver/request-response/data/EvitaResponse'
import { ExtraResults } from '@/modules/database-driver/request-response/data/ExtraResults'
import { QueryTelemetry } from '@/modules/database-driver/request-response/data/QueryTelemetry'
import { QueryPhase } from '@/modules/database-driver/request-response/data/QueryPhase'
import type { DataChunk } from '@/modules/database-driver/request-response/data/DataChunk'
import type { EvitaClient } from '@/modules/database-driver/EvitaClient'

/**
 * The analyzer offers the query telemetry visualiser when the response carries telemetry, and only then. The generic
 * `entity` collection is used because it needs no entity schema, hence no server.
 */

const unusableClient: EvitaClient = {} as unknown as EvitaClient

function typesOf(result: AnalyzedResult): VisualiserTypeType[] {
    return result.queries[0]!.visualiserTypes.map(it => it.value)
}

describe('evitaQL result analyzer', () => {
    const analyzer: EvitaQLResultAnalyzer = new EvitaQLResultAnalyzer(unusableClient)
    const query: string = 'query(collection(\'entity\'), require(queryTelemetry()))'

    function response(telemetry: QueryTelemetry | undefined): EvitaResponse {
        return new EvitaResponse(
            {} as unknown as DataChunk,
            new ExtraResults(undefined, undefined, undefined, undefined, undefined, undefined, telemetry),
            '{}'
        )
    }

    test('Should offer query telemetry when the response carries it', async () => {
        const telemetry: QueryTelemetry = new QueryTelemetry(
            QueryPhase.Overall, 0n, 1n, 1n, ImmutableList(), undefined, undefined, undefined, ImmutableList()
        )
        expect(typesOf(await analyzer.analyze(query, response(telemetry), 'evita')))
            .toEqual([VisualiserTypeType.QueryTelemetry])
    })

    test('Should not offer query telemetry when the response lacks it', async () => {
        expect(typesOf(await analyzer.analyze(query, response(undefined), 'evita'))).toEqual([])
    })
})
