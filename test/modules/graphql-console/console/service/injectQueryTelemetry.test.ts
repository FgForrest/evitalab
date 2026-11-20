import { describe, expect, test } from 'vitest'
import { type FieldNode, Kind, type OperationDefinitionNode, parse, print, type SelectionNode } from 'graphql'
import { injectQueryTelemetry } from '@/modules/graphql-console/console/service/injectQueryTelemetry'
import {
    QueryTelemetryInjectionError,
    QueryTelemetryInjectionFailureReason
} from '@/modules/console/exception/QueryTelemetryInjectionError'

const telemetrySelection: string =
    'queryTelemetry { level operation start spentTime selfTime arguments stepsCount startedAt ' +
    'metrics { estimatedCardinality actualCardinality estimatedCost actualCost recordsReturned ioFetchCount ' +
    'ioFetchedSizeBytes prefetched } ' +
    'plan { level id refTo hash description estimatedCost actualCost resultCount childrenCount } }'

function topLevelFields(document: string): FieldNode[] {
    const operation = parse(document).definitions[0] as OperationDefinitionNode
    return operation.selectionSet.selections as FieldNode[]
}

function childFields(field: FieldNode | undefined): FieldNode[] {
    return (field?.selectionSet?.selections ?? [])
        .filter((selection: SelectionNode) => selection.kind === Kind.FIELD) as FieldNode[]
}

function responseKey(field: FieldNode): string {
    return field.alias?.value ?? field.name.value
}

function field(fields: FieldNode[], key: string): FieldNode | undefined {
    return fields.find(it => responseKey(it) === key)
}

function countOf(text: string, needle: string): number {
    return text.split(needle).length - 1
}

/**
 * Returns the `queryTelemetry` field selected by the given top-level field (by response key).
 */
function telemetryOf(document: string, queryFieldKey: string): FieldNode | undefined {
    const extraResults = field(childFields(field(topLevelFields(document), queryFieldKey)), 'extraResults')
    return field(childFields(extraResults), 'queryTelemetry')
}

describe('GraphQL query telemetry injector', () => {
    describe('sample queries', () => {
        test('Should add extraResults with telemetry to a query without extraResults', () => {
            const injected: string = injectQueryTelemetry(
                '{ queryProduct(filterBy: {entityPrimaryKeyInSet: [108310, 108313, 108315], entityLocaleEquals: en}) ' +
                '{ recordPage { data { primaryKey attributes { code name } } } } }'
            )
            const telemetry: FieldNode | undefined = telemetryOf(injected, 'queryProduct')
            expect(telemetry).toBeDefined()
            expect(childFields(telemetry).map(it => it.name.value)).toEqual([
                'level', 'operation', 'start', 'spentTime', 'selfTime', 'arguments', 'stepsCount', 'startedAt', 'metrics', 'plan'
            ])
            expect(childFields(field(childFields(telemetry), 'plan')).map(it => it.name.value)).toEqual([
                'level', 'id', 'refTo', 'hash', 'description', 'estimatedCost', 'actualCost', 'resultCount', 'childrenCount'
            ])
            expect(childFields(field(childFields(telemetry), 'metrics')).map(it => it.name.value)).toEqual([
                'estimatedCardinality', 'actualCardinality', 'estimatedCost', 'actualCost', 'recordsReturned',
                'ioFetchCount', 'ioFetchedSizeBytes', 'prefetched'
            ])
            expect(injected).toContain('filterBy: {entityPrimaryKeyInSet: [108310, 108313, 108315], entityLocaleEquals: en}')
        })

        test('Should add telemetry next to the other extra results', () => {
            const injected: string = injectQueryTelemetry(
                'query Listing($size: Int!) { queryProduct(filterBy: {hierarchyCategoriesWithin: {ofParent: {entityPrimaryKeyInSet: [66467]}}}) ' +
                '{ recordPage(size: $size) { data { primaryKey } } extraResults { priceHistogram { min max } ' +
                'hierarchy { categories { parents { level } } } } } }'
            )
            const extraResults = field(childFields(field(topLevelFields(injected), 'queryProduct')), 'extraResults')
            expect(childFields(extraResults).map(responseKey)).toEqual(['priceHistogram', 'hierarchy', 'queryTelemetry'])
            expect(injected).toContain('query Listing($size: Int!)')
            expect(countOf(injected, 'extraResults')).toBe(1)
        })

        test('Should add telemetry to every query field', () => {
            const injected: string = injectQueryTelemetry(
                '{ queryProduct { recordPage { data { primaryKey } } } ' +
                'categories: queryCategory { recordPage { data { primaryKey } } extraResults { hierarchy { self { fromRoot(stopAt: {distance: 2}) { level } } } } } }'
            )
            expect(telemetryOf(injected, 'queryProduct')).toBeDefined()
            expect(telemetryOf(injected, 'categories')).toBeDefined()
            expect(countOf(injected, 'queryTelemetry')).toBe(2)
        })
    })

    test('Should add an unaliased extraResults next to an aliased one', () => {
        const injected: string = injectQueryTelemetry(
            '{ queryProduct { extra: extraResults { priceHistogram { min } } } }'
        )
        const fields: FieldNode[] = childFields(field(topLevelFields(injected), 'queryProduct'))
        expect(fields.map(responseKey)).toEqual(['extra', 'extraResults'])
        expect(childFields(field(fields, 'extra')).map(responseKey)).toEqual(['priceHistogram'])
        expect(telemetryOf(injected, 'queryProduct')).toBeDefined()
    })

    test('Should leave a query already selecting telemetry unchanged', () => {
        const query: string =
            '# my query\n{ queryProduct { recordPage { data { primaryKey } } extraResults { queryTelemetry { level operation spentTime } } } }'
        expect(injectQueryTelemetry(query)).toBe(query)
    })

    test('Should be idempotent', () => {
        const once: string = injectQueryTelemetry('{ queryProduct { recordPage { data { primaryKey } } } }')
        expect(injectQueryTelemetry(once)).toBe(once)
    })

    test('Should leave get and list fields alone', () => {
        const injected: string = injectQueryTelemetry(
            '{ getProduct(primaryKey: 1) { primaryKey } listCategory { primaryKey } queryBrand { recordPage { data { primaryKey } } } }'
        )
        const fields: FieldNode[] = topLevelFields(injected)
        expect(childFields(field(fields, 'getProduct')).map(responseKey)).toEqual(['primaryKey'])
        expect(childFields(field(fields, 'listCategory')).map(responseKey)).toEqual(['primaryKey'])
        expect(telemetryOf(injected, 'queryBrand')).toBeDefined()
    })

    test('Should not inspect fragments', () => {
        const injected: string = injectQueryTelemetry(
            '{ queryProduct { ...page } } fragment page on ProductFullQueryResponse { recordPage { data { primaryKey } } }'
        )
        expect(telemetryOf(injected, 'queryProduct')).toBeDefined()
        expect(injected).toContain('fragment page on ProductFullQueryResponse {\n  recordPage {')
        expect(countOf(injected, 'queryTelemetry')).toBe(1)
    })

    test('Should produce exactly the documented selection', () => {
        const injected: string = injectQueryTelemetry('{ queryProduct { recordPage { data { primaryKey } } } }')
        const expected: string = print(parse(
            `{ queryProduct { recordPage { data { primaryKey } } extraResults { ${telemetrySelection} } } }`
        ))
        expect(injected).toBe(expected)
    })

    test('Should reject an unparseable document', () => {
        const run = (): string => injectQueryTelemetry('{ queryProduct { recordPage { ')
        expect(run).toThrow(QueryTelemetryInjectionError)
        try {
            run()
        } catch (e) {
            expect((e as QueryTelemetryInjectionError).reason).toBe(QueryTelemetryInjectionFailureReason.Unparseable)
        }
    })

    test('Should reject a document without any query field', () => {
        try {
            injectQueryTelemetry('{ getProduct(primaryKey: 1) { primaryKey } }')
            expect.unreachable()
        } catch (e) {
            expect(e).toBeInstanceOf(QueryTelemetryInjectionError)
            expect((e as QueryTelemetryInjectionError).reason).toBe(QueryTelemetryInjectionFailureReason.NoTarget)
        }
    })
})
