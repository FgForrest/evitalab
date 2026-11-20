import { describe, expect, test } from 'vitest'
import {
    GraphQLResultAnalyzer
} from '@/modules/graphql-console/console/result-visualiser/service/GraphQLResultAnalyzer'
import { VisualiserTypeType } from '@/modules/console/result-visualiser/model/VisualiserTypeType'
import type { AnalyzedResult } from '@/modules/console/result-visualiser/model/AnalyzedResult'
import type { EvitaClient } from '@/modules/database-driver/EvitaClient'

/**
 * The analyzer offers the query telemetry visualiser when a query field carries a non-empty `queryTelemetry` list, and
 * only then - whatever the selection inside it, which is the parser's concern. The generic `queryEntity` query is used
 * because it needs no entity schema, hence no server.
 */

const unusableClient: EvitaClient = {} as unknown as EvitaClient

function typesOf(result: AnalyzedResult): VisualiserTypeType[] {
    return result.queries[0]!.visualiserTypes.map(it => it.value)
}

describe('GraphQL result analyzer', () => {
    const analyzer: GraphQLResultAnalyzer = new GraphQLResultAnalyzer(unusableClient)

    test('Should offer query telemetry when a query field carries the telemetry list', async () => {
        const result: AnalyzedResult = await analyzer.analyze('', {
            data: { queryEntity: { extraResults: { queryTelemetry: [{ level: 1 }] } } }
        }, 'evita')
        expect(typesOf(result)).toEqual([VisualiserTypeType.QueryTelemetry])
    })

    test('Should offer query telemetry even when required fields are missing from the selection', async () => {
        const result: AnalyzedResult = await analyzer.analyze('', {
            data: { queryEntity: { extraResults: { queryTelemetry: [{ selfTime: '1' }] } } }
        }, 'evita')
        expect(typesOf(result)).toEqual([VisualiserTypeType.QueryTelemetry])
    })

    test('Should not offer query telemetry without the telemetry list', async () => {
        const result: AnalyzedResult = await analyzer.analyze('', {
            data: { queryEntity: { extraResults: { queryTelemetry: null } } }
        }, 'evita')
        expect(typesOf(result)).toEqual([])
    })

    test('Should not offer query telemetry for an empty telemetry list', async () => {
        const result: AnalyzedResult = await analyzer.analyze('', {
            data: { queryEntity: { extraResults: { queryTelemetry: [] } } }
        }, 'evita')
        expect(typesOf(result)).toEqual([])
    })
})
