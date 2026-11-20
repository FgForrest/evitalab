import type { InjectionKey } from 'vue'
import type { ResultVisualiserService } from '@/modules/console/result-visualiser/service/ResultVisualiserService'
import type { ResultAnalyzer } from '@/modules/console/result-visualiser/service/ResultAnalyzer'
import type { FacetSummaryResultParser } from '@/modules/console/result-visualiser/service/FacetSummaryResultParser'
import type { ReferenceSummaryResultParser } from '@/modules/console/result-visualiser/service/ReferenceSummaryResultParser'
import type { HierarchyResultParser } from '@/modules/console/result-visualiser/service/HierarchyResultParser'
import type { AttributeHistogramsResultParser } from '@/modules/console/result-visualiser/service/AttributeHistogramsResultParser'
import type { PriceHistogramResultParser } from '@/modules/console/result-visualiser/service/PriceHistogramResultParser'
import type { QueryTelemetryResultParser } from '@/modules/console/result-visualiser/service/QueryTelemetryResultParser'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { mandatoryInject } from '@/utils/reactivity'
import { RestResultAnalyzer } from '@/modules/rest-console/console/result-visualiser/service/RestResultAnalyzer'
import { RestFacetSummaryResultParser } from '@/modules/rest-console/console/result-visualiser/service/RestFacetSummaryResultParser'
import { RestReferenceSummaryResultParser } from '@/modules/rest-console/console/result-visualiser/service/RestReferenceSummaryResultParser'
import { RestHierarchyResultParser } from '@/modules/rest-console/console/result-visualiser/service/RestHierarchyResultParser'
import { RestAttributeHistogramsResultParser } from '@/modules/rest-console/console/result-visualiser/service/RestAttributeHistogramsResultParser'
import { RestPriceHistogramResultParser } from '@/modules/rest-console/console/result-visualiser/service/RestPriceHistogramResultParser'
import { RestQueryTelemetryResultParser } from '@/modules/rest-console/console/result-visualiser/service/RestQueryTelemetryResultParser'

export const restResultVisualiserServiceInjectionKey: InjectionKey<RestResultVisualiserService> = Symbol('restResultVisualiserService')

export function useRestResultVisualiserService(): RestResultVisualiserService {
    return mandatoryInject(restResultVisualiserServiceInjectionKey) as RestResultVisualiserService
}

/**
 * {@link ResultVisualiserService} implementation for the REST API. Bundles all REST-specific analyzer and parsers.
 * The visualised result must be parsed bigint-safely (`parseRestResultJson`).
 */
export class RestResultVisualiserService implements ResultVisualiserService {
    readonly resultAnalyzer: ResultAnalyzer<unknown>
    readonly facetSummaryParser: FacetSummaryResultParser<unknown>
    readonly referenceSummaryParser: ReferenceSummaryResultParser<unknown>
    readonly hierarchyParser: HierarchyResultParser<unknown>
    readonly attributeHistogramsParser: AttributeHistogramsResultParser<unknown>
    readonly priceHistogramParser: PriceHistogramResultParser<unknown>
    readonly queryTelemetryParser: QueryTelemetryResultParser<unknown>

    constructor(evitaClient: EvitaClient) {
        this.resultAnalyzer = new RestResultAnalyzer(evitaClient)
        this.facetSummaryParser = new RestFacetSummaryResultParser(evitaClient)
        this.referenceSummaryParser = new RestReferenceSummaryResultParser(evitaClient)
        this.hierarchyParser = new RestHierarchyResultParser(evitaClient)
        this.attributeHistogramsParser = new RestAttributeHistogramsResultParser()
        this.priceHistogramParser = new RestPriceHistogramResultParser()
        this.queryTelemetryParser = new RestQueryTelemetryResultParser()
    }
}
