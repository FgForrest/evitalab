import { describe, expect, test } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Map as ImmutableMap } from 'immutable'
import { parseRestResultJson } from '@/modules/rest-console/console/service/parseRestResultJson'
import { RestResultAnalyzer } from '@/modules/rest-console/console/result-visualiser/service/RestResultAnalyzer'
import { RestFacetSummaryResultParser } from '@/modules/rest-console/console/result-visualiser/service/RestFacetSummaryResultParser'
import { RestReferenceSummaryResultParser } from '@/modules/rest-console/console/result-visualiser/service/RestReferenceSummaryResultParser'
import { RestHierarchyResultParser } from '@/modules/rest-console/console/result-visualiser/service/RestHierarchyResultParser'
import { RestAttributeHistogramsResultParser } from '@/modules/rest-console/console/result-visualiser/service/RestAttributeHistogramsResultParser'
import { RestPriceHistogramResultParser } from '@/modules/rest-console/console/result-visualiser/service/RestPriceHistogramResultParser'
import { RestQueryTelemetryResultParser } from '@/modules/rest-console/console/result-visualiser/service/RestQueryTelemetryResultParser'
import { resolveRestQueryCollection } from '@/modules/rest-console/console/result-visualiser/service/resolveRestQueryCollection'
import { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion'
import { VisualiserTypeType } from '@/modules/console/result-visualiser/model/VisualiserTypeType'
import type { EvitaClient } from '@/modules/database-driver/EvitaClient'
import type { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import type { AnalyzedResult } from '@/modules/console/result-visualiser/model/AnalyzedResult'
import { ParsedQueryTelemetry } from '@/modules/console/result-visualiser/model/query-telemetry/QueryTelemetryParseResult'
import type { QueryTelemetryParseResult } from '@/modules/console/result-visualiser/model/query-telemetry/QueryTelemetryParseResult'
import { visualiseQueryTelemetry } from '@/modules/console/result-visualiser/service/query-telemetry/visualiseQueryTelemetry'
import type { VisualisedQueryTelemetry } from '@/modules/console/result-visualiser/model/query-telemetry/VisualisedQueryTelemetry'
import { QueryPhase } from '@/modules/database-driver/request-response/data/QueryPhase'

/**
 * Real responses of a local evitaDB (demo dataset), trimmed: a `Product` query with hierarchy, facet summary, price
 * and attribute histograms and `queryTelemetry: PLAN`; a query with a reference summary; a `Category` query with the
 * self hierarchy and its statistics.
 */

function fixture(name: string): string {
    return readFileSync(fileURLToPath(new URL(`../../../fixtures/${name}`, import.meta.url)), 'utf-8')
}

const queryResponseText: string = fixture('query-response.json')
const queryResponse: unknown = parseRestResultJson(queryResponseText)
const referenceSummaryResponse: unknown = parseRestResultJson(fixture('reference-summary-response.json'))
const selfHierarchyResponse: unknown = parseRestResultJson(fixture('self-hierarchy-response.json'))

function variants(name: string): ImmutableMap<NamingConvention, string> {
    return ImmutableMap([[NamingConvention.CamelCase, name], [NamingConvention.PascalCase, name.charAt(0).toUpperCase() + name.substring(1)]])
}

function referenceSchema(name: string, entityType: string, groupType?: string): unknown {
    return {
        name,
        nameVariants: variants(name),
        entityType,
        referencedEntityTypeManaged: true,
        referencedGroupType: groupType,
        referencedGroupTypeManaged: groupType != undefined
    }
}

function attributeSchema(name: string, representative: boolean): unknown {
    return { name, nameVariants: variants(name), representative }
}

const productSchema: EntitySchema = {
    name: 'Product',
    nameVariants: variants('product'),
    attributes: ImmutableMap([
        ['battery-life', { name: 'battery-life', nameVariants: ImmutableMap([[NamingConvention.CamelCase, 'batteryLife']]), representative: false }]
    ]),
    references: ImmutableMap([
        ['groups', referenceSchema('groups', 'Group')],
        ['tags', referenceSchema('tags', 'Tag', 'TagCategory')],
        ['brand', referenceSchema('brand', 'Brand')],
        ['categories', referenceSchema('categories', 'Category')]
    ])
} as unknown as EntitySchema

const categorySchema: EntitySchema = {
    name: 'Category',
    nameVariants: variants('category'),
    attributes: ImmutableMap([['code', attributeSchema('code', true)]]),
    references: ImmutableMap()
} as unknown as EntitySchema

/** Every referenced entity type has `code` as its representative attribute. */
const client: EvitaClient = {
    queryCatalog: async (_catalogName: string, logic: (session: unknown) => Promise<unknown>) => await logic({
        getEntitySchemaOrThrowException: async () => ({
            attributes: ImmutableMap([['code', attributeSchema('code', true)]])
        }),
        getCatalogSchema: async () => ({
            entitySchemas: async () => ImmutableMap([['Product', productSchema], ['Category', categorySchema]])
        })
    })
} as unknown as EvitaClient

describe('REST query collection resolution', () => {
    test('Should resolve the collection of query operations only', () => {
        expect(resolveRestQueryCollection('/Product/query')).toBe('Product')
        expect(resolveRestQueryCollection('/{locale}/Product/query')).toBe('Product')
        expect(resolveRestQueryCollection('/Product/list')).toBeUndefined()
        expect(resolveRestQueryCollection('/entity/list')).toBeUndefined()
    })
})

describe('REST result analyzer', () => {
    const analyzer: RestResultAnalyzer = new RestResultAnalyzer(client)

    test('Should offer every visualiser the query result carries', async () => {
        const result: AnalyzedResult = await analyzer.analyze('/{locale}/Product/query', queryResponse, 'evita')
        expect(result.queries).toHaveLength(1)
        expect(result.queries[0]?.entitySchema).toBe(productSchema)
        expect(result.queries[0]?.visualiserTypes.map(it => it.value)).toEqual([
            VisualiserTypeType.FacetSummary,
            VisualiserTypeType.Hierarchy,
            VisualiserTypeType.AttributeHistograms,
            VisualiserTypeType.PriceHistogram,
            VisualiserTypeType.QueryTelemetry
        ])
    })

    test('Should not analyze anything but entity queries', async () => {
        expect((await analyzer.analyze('/Product/get/{primaryKey}', queryResponse, 'evita')).queries).toHaveLength(0)
    })
})

describe('REST result parsers', () => {
    test('Should parse the facet summary of grouped and ungrouped references', async () => {
        const summary = await new RestFacetSummaryResultParser(client).parse(queryResponse, productSchema, 'evita')
        expect(summary.references.map(it => it.referenceSchema?.name)).toEqual(['groups', 'tags', 'brand'])
        const groups = summary.references[0]!
        expect(groups.groups.size).toBe(1)
        expect(groups.groups.first()?.facets.first()?.title).toBe('sale')
        expect(groups.groups.first()?.facets.first()?.impactDifference).toBe('-264')
        expect(groups.groups.first()?.facets.first()?.numberOfEntities).toBe(269)
        const tags = summary.references[1]!
        expect(tags.groups.size).toBe(2)
        expect(tags.groups.first()?.groupStatistics.primaryKey).toBeTypeOf('number')
    })

    test('Should parse the reference summary', async () => {
        const summary = await new RestReferenceSummaryResultParser(client).parse(referenceSummaryResponse, productSchema, 'evita')
        expect(summary.references.map(it => it.referenceSchema?.name)).toEqual(['groups', 'tags'])
        expect(summary.references[0]?.groups.first()?.facets.first()?.title).toBe('sale')
        expect(summary.references[0]?.groups.first()?.histograms.isEmpty()).toBe(true)
    })

    test('Should build the nested hierarchy of a reference', async () => {
        const result = await new RestHierarchyResultParser(client).parse(queryResponse, productSchema, 'evita')
        const roots = result.references[0]!.namedHierarchies[0]!
        expect(roots.name).toBe('roots')
        const tree = roots.hierarchy.trees.first()
        expect(tree?.primaryKey).toBe(66468)
        expect(tree?.title).toBe('Accessories, accessories')
        expect(tree?.children.first()?.primaryKey).toBe(66481)
        expect(roots.hierarchy.count).toBe(2)
    })

    test('Should build the self hierarchy with statistics', async () => {
        const result = await new RestHierarchyResultParser(client).parse(selfHierarchyResponse, categorySchema, 'evita')
        expect(result.references[0]?.referenceSchema).toBeUndefined()
        const megaMenu = result.references[0]!.namedHierarchies[0]!
        expect(megaMenu.name).toBe('megaMenu')
        const portables = megaMenu.hierarchy.trees.first()
        expect(portables?.title).toBe('portables')
        expect(portables?.childrenCount).toBe(3)
        expect(portables?.queriedEntityCount).toBe(3)
        expect(portables?.children.map(it => it.title).toArray()).toEqual(['phones', 'tablets', 'e-readers'])
    })

    test('Should parse the histograms', () => {
        const attributeHistograms = new RestAttributeHistogramsResultParser().parse(queryResponse, productSchema)
        expect(attributeHistograms.histograms[0]?.attributeSchema.name).toBe('battery-life')
        expect(attributeHistograms.histograms[0]?.histogram.buckets.size).toBe(5)
        const priceHistogram = new RestPriceHistogramResultParser().parse(queryResponse)
        expect(priceHistogram.overallCount).toBe(391)
        expect(priceHistogram.min?.toString()).toBe('39.00')
    })
})

describe('REST query telemetry parser', () => {
    const parse = (response: unknown): QueryTelemetryParseResult | undefined =>
        new RestQueryTelemetryResultParser().parse(response)

    test('Should rebuild the nested telemetry tree', () => {
        const result = parse(queryResponse)
        expect(result).toBeInstanceOf(ParsedQueryTelemetry)
        const telemetry = (result as ParsedQueryTelemetry).telemetry
        expect(telemetry.operation).toBe(QueryPhase.Overall)
        expect(telemetry.steps.map(it => it.operation).toArray()).toContain(QueryPhase.Planning)
        expect(telemetry.metrics?.actualCardinality).toBe(269n)
        expect(telemetry.startedAt).toBeDefined()
        expect((result as ParsedQueryTelemetry).missingSelections.isEmpty()).toBe(true)
    })

    test('Should keep plan hashes above 2^53 exact', () => {
        // the root plan hash of the fixture, as sent by the server; a plain JSON.parse would round it
        const rootHash: bigint = -1670645581396870523n
        expect(queryResponseText).toContain(`"hash": ${rootHash}`)
        const telemetry = (parse(queryResponse) as ParsedQueryTelemetry).telemetry
        expect(telemetry.plan?.hash).toBe(rootHash)
        expect(BigInt(JSON.parse(queryResponseText).extraResults.queryTelemetry.plan.hash)).not.toBe(rootHash)
        expect(telemetry.plan?.children.isEmpty()).toBe(false)
    })

    test('Should recognize the winning index-selection alternative by its plan hash', () => {
        const visualised: VisualisedQueryTelemetry = visualiseQueryTelemetry(parse(queryResponse) as ParsedQueryTelemetry)
        const verdicts = visualised.steps
            .map(step => step.alternative)
            .filter(verdict => verdict != undefined && verdict.eligible)
        expect(verdicts.some(verdict => verdict?.winner === true)).toBe(true)
        expect(verdicts.some(verdict => verdict?.hashUnknown === true)).toBe(false)
    })

    test('Should ignore results without telemetry', () => {
        expect(parse(referenceSummaryResponse)).toBeUndefined()
    })
})
