/**
 * {@link ResultVisualiserService} implementation for GraphQL query language.
 * Bundles all GraphQL-specific analyzer and parsers.
 */
import type { InjectionKey } from 'vue'
import type { ResultVisualiserService } from '@/modules/console/result-visualiser/service/ResultVisualiserService'
import type { ResultAnalyzer } from '@/modules/console/result-visualiser/service/ResultAnalyzer'
import type { FacetSummaryResultParser } from '@/modules/console/result-visualiser/service/FacetSummaryResultParser'
import type { ReferenceSummaryResultParser } from '@/modules/console/result-visualiser/service/ReferenceSummaryResultParser'
import type { HierarchyResultParser } from '@/modules/console/result-visualiser/service/HierarchyResultParser'
import type { AttributeHistogramsResultParser } from '@/modules/console/result-visualiser/service/AttributeHistogramsResultParser'
import type { PriceHistogramResultParser } from '@/modules/console/result-visualiser/service/PriceHistogramResultParser'
import { GraphQLResultAnalyzer } from '@/modules/graphql-console/console/result-visualiser/service/GraphQLResultAnalyzer'
import { GraphQLFacetSummaryResultParser } from '@/modules/graphql-console/console/result-visualiser/service/GraphQLFacetSummaryResultParser'
import { GraphQLReferenceSummaryResultParser } from '@/modules/graphql-console/console/result-visualiser/service/GraphQLReferenceSummaryResultParser'
import { GraphQLHierarchyResultParser } from '@/modules/graphql-console/console/result-visualiser/service/GraphQLHierarchyResultParser'
import { GraphQLAttributeHistogramsResultParser } from '@/modules/graphql-console/console/result-visualiser/service/GraphQLAttributeHistogramsResultParser'
import { GraphQLPriceHistogramResultParser } from '@/modules/graphql-console/console/result-visualiser/service/GraphQLPriceHistogramResultParser'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { mandatoryInject } from '@/utils/reactivity'

export const graphQLResultVisualiserServiceInjectionKey: InjectionKey<GraphQLResultVisualiserService> = Symbol('graphQLResultVisualiserService')

export function useGraphQLResultVisualiserService(): GraphQLResultVisualiserService {
    return mandatoryInject(graphQLResultVisualiserServiceInjectionKey) as GraphQLResultVisualiserService
}

export class GraphQLResultVisualiserService implements ResultVisualiserService {
    readonly resultAnalyzer: ResultAnalyzer<unknown>
    readonly facetSummaryParser: FacetSummaryResultParser<unknown>
    readonly referenceSummaryParser: ReferenceSummaryResultParser<unknown>
    readonly hierarchyParser: HierarchyResultParser<unknown>
    readonly attributeHistogramsParser: AttributeHistogramsResultParser<unknown>
    readonly priceHistogramParser: PriceHistogramResultParser<unknown>

    constructor(evitaClient: EvitaClient) {
        this.resultAnalyzer = new GraphQLResultAnalyzer(evitaClient)
        this.facetSummaryParser = new GraphQLFacetSummaryResultParser(evitaClient)
        this.referenceSummaryParser = new GraphQLReferenceSummaryResultParser(evitaClient)
        this.hierarchyParser = new GraphQLHierarchyResultParser(evitaClient)
        this.attributeHistogramsParser = new GraphQLAttributeHistogramsResultParser()
        this.priceHistogramParser = new GraphQLPriceHistogramResultParser()
    }
}
