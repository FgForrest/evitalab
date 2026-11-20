import { describe, expect, test } from 'vitest'
import { injectQueryTelemetry } from '@/modules/evitaql-console/console/service/injectQueryTelemetry'
import {
    QueryTelemetryInjectionError,
    QueryTelemetryInjectionFailureReason
} from '@/modules/console/exception/QueryTelemetryInjectionError'
import { minifyEvitaQL } from '@/modules/code-editor/service/formatEvitaQL'

/**
 * The returned query must stay valid evitaQL — the minifier throws on any syntax error.
 */
function injectValid(query: string): string {
    const injected: string = injectQueryTelemetry(query)
    expect(() => minifyEvitaQL(injected)).not.toThrow()
    return injected
}

describe('evitaQL query telemetry injector', () => {
    describe('sample queries', () => {
        test('Should append to the require of a PK fetch with bodies', () => {
            const query: string =
                'query(\n' +
                '  collection(\'Product\'),\n' +
                '  filterBy(entityPrimaryKeyInSet(108310, 108313, 108315), entityLocaleEquals(\'en\'), priceInCurrency(\'EUR\'), priceInPriceLists(\'basic\')),\n' +
                '  require(\n' +
                '    entityFetch(attributeContent(\'code\', \'name\'), priceContentRespectingFilter(), referenceContent(\'brand\', entityFetch(attributeContent(\'code\'))))\n' +
                '  )\n' +
                ')'
            expect(injectValid(query)).toEqual(
                'query(\n' +
                '  collection(\'Product\'),\n' +
                '  filterBy(entityPrimaryKeyInSet(108310, 108313, 108315), entityLocaleEquals(\'en\'), priceInCurrency(\'EUR\'), priceInPriceLists(\'basic\')),\n' +
                '  require(\n' +
                '    entityFetch(attributeContent(\'code\', \'name\'), priceContentRespectingFilter(), referenceContent(\'brand\', entityFetch(attributeContent(\'code\')))), queryTelemetry(PLAN)\n' +
                '  )\n' +
                ')'
            )
        })

        test('Should append to the require of a nested reference query', () => {
            const query: string =
                'query(collection(\'Product\'), filterBy(referenceHaving(\'brand\', entityHaving(attributeEquals(\'code\', \'apple\'))), entityLocaleEquals(\'en\')), ' +
                'orderBy(attributeNatural(\'code\', ASC)), require(page(1, 20)))'
            expect(injectValid(query)).toEqual(
                'query(collection(\'Product\'), filterBy(referenceHaving(\'brand\', entityHaving(attributeEquals(\'code\', \'apple\'))), entityLocaleEquals(\'en\')), ' +
                'orderBy(attributeNatural(\'code\', ASC)), require(page(1, 20), queryTelemetry(PLAN)))'
            )
        })

        test('Should append after the last extra result requirement', () => {
            const query: string =
                'query(\n' +
                '  collection(\'Product\'),\n' +
                '  filterBy(hierarchyWithin(\'categories\', entityPrimaryKeyInSet(66467)), entityLocaleEquals(\'en\'), priceInCurrency(\'EUR\'), priceInPriceLists(\'basic\')),\n' +
                '  orderBy(priceNatural(ASC)),\n' +
                '  require(\n' +
                '    page(1, 20),\n' +
                '    facetSummary(IMPACT),\n' +
                '    priceHistogram(20),\n' +
                '    attributeHistogram(10, \'weight\'),\n' +
                '    hierarchyOfReference(\'categories\', fromRoot(\'megaMenu\', stopAt(distance(2))))\n' +
                '  )\n' +
                ')'
            expect(injectValid(query)).toContain(
                '    hierarchyOfReference(\'categories\', fromRoot(\'megaMenu\', stopAt(distance(2)))), queryTelemetry(PLAN)\n' +
                '  )\n' +
                ')'
            )
        })

        test('Should add a require to a query that has none', () => {
            const query: string =
                'query(collection(\'Product\'), filterBy(attributeStartsWith(\'code\', \'apple\'), referenceHaving(\'brand\', entityPrimaryKeyInSet(66465)), ' +
                'hierarchyWithin(\'categories\', entityPrimaryKeyInSet(66466)), entityLocaleEquals(\'en\')), orderBy(attributeNatural(\'code\', ASC)))'
            expect(injectValid(query)).toEqual(
                'query(collection(\'Product\'), filterBy(attributeStartsWith(\'code\', \'apple\'), referenceHaving(\'brand\', entityPrimaryKeyInSet(66465)), ' +
                'hierarchyWithin(\'categories\', entityPrimaryKeyInSet(66466)), entityLocaleEquals(\'en\')), orderBy(attributeNatural(\'code\', ASC)), ' +
                'require(queryTelemetry(PLAN)))'
            )
        })

        test('Should add a require to a filter-only query', () => {
            expect(injectValid('query(collection(\'Product\'), filterBy(attributeEquals(\'code\', \'no-such-code-xyz\')))')).toEqual(
                'query(collection(\'Product\'), filterBy(attributeEquals(\'code\', \'no-such-code-xyz\')), require(queryTelemetry(PLAN)))'
            )
        })
    })

    test('Should keep comments and place the requirement before a trailing comment', () => {
        const query: string =
            '// products of one brand\n' +
            'query(\n' +
            '  collection(\'Product\'), // the collection\n' +
            '  require(\n' +
            '    // fetch everything\n' +
            '    entityFetch(attributeContentAll()) // bodies\n' +
            '  )\n' +
            ')'
        expect(injectValid(query)).toEqual(
            '// products of one brand\n' +
            'query(\n' +
            '  collection(\'Product\'), // the collection\n' +
            '  require(\n' +
            '    // fetch everything\n' +
            '    entityFetch(attributeContentAll()), queryTelemetry(PLAN) // bodies\n' +
            '  )\n' +
            ')'
        )
    })

    test('Should add a require after a trailing comment of the last query argument', () => {
        const query: string =
            'query(\n' +
            '  collection(\'Product\') // the collection\n' +
            ')'
        expect(injectValid(query)).toEqual(
            'query(\n' +
            '  collection(\'Product\'), require(queryTelemetry(PLAN)) // the collection\n' +
            ')'
        )
    })

    test('Should handle a one-line query', () => {
        expect(injectValid('query(collection(\'Product\'),require(entityFetch()))'))
            .toEqual('query(collection(\'Product\'),require(entityFetch(), queryTelemetry(PLAN)))')
    })

    test('Should fill an empty require without a leading comma', () => {
        expect(injectValid('query(collection(\'Product\'), require())'))
            .toEqual('query(collection(\'Product\'), require(queryTelemetry(PLAN)))')
    })

    test('Should leave a query already requesting telemetry unchanged', () => {
        const withPlan: string = 'query(collection(\'Product\'), require(entityFetch(), queryTelemetry(PLAN)))'
        expect(injectQueryTelemetry(withPlan)).toBe(withPlan)

        const withoutArguments: string = 'query(collection(\'Product\'), require(queryTelemetry()))'
        expect(injectQueryTelemetry(withoutArguments)).toBe(withoutArguments)
    })

    test('Should be idempotent', () => {
        const once: string = injectQueryTelemetry('query(collection(\'Product\'))')
        expect(injectQueryTelemetry(once)).toBe(once)
    })

    test('Should reject an unparseable query', () => {
        const run = (): string => injectQueryTelemetry('query(collection(\'Product\'), filterBy(')
        expect(run).toThrow(QueryTelemetryInjectionError)
        try {
            run()
        } catch (e) {
            expect((e as QueryTelemetryInjectionError).reason).toBe(QueryTelemetryInjectionFailureReason.Unparseable)
        }
    })

    test('Should reject a document without a query', () => {
        expect(() => injectQueryTelemetry('// just a comment')).toThrow(QueryTelemetryInjectionError)
        expect(() => injectQueryTelemetry('')).toThrow(QueryTelemetryInjectionError)
    })
})
