/**
 * {@link ResultVisualiserService} implementation for EvitaQL query language.
 * Bundles all EvitaQL-specific analyzer and parsers.
 */
import type { InjectionKey } from 'vue'
import type { ResultVisualiserService } from '@/modules/console/result-visualiser/service/ResultVisualiserService'
import type { ResultAnalyzer } from '@/modules/console/result-visualiser/service/ResultAnalyzer'
import type { FacetSummaryResultParser } from '@/modules/console/result-visualiser/service/FacetSummaryResultParser'
import type { ReferenceSummaryResultParser } from '@/modules/console/result-visualiser/service/ReferenceSummaryResultParser'
import type { HierarchyResultParser } from '@/modules/console/result-visualiser/service/HierarchyResultParser'
import type { AttributeHistogramsResultParser } from '@/modules/console/result-visualiser/service/AttributeHistogramsResultParser'
import type { PriceHistogramResultParser } from '@/modules/console/result-visualiser/service/PriceHistogramResultParser'
import { EvitaQLResultAnalyzer } from '@/modules/evitaql-console/console/result-visualiser/service/EvitaQLResultAnalyzer'
import { EvitaQLFacetSummaryResultParser } from '@/modules/evitaql-console/console/result-visualiser/service/EvitaQLFacetSummaryResultParser'
import { EvitaQLReferenceSummaryResultParser } from '@/modules/evitaql-console/console/result-visualiser/service/EvitaQLReferenceSummaryResultParser'
import { EvitaQLHierarchyResultParser } from '@/modules/evitaql-console/console/result-visualiser/service/EvitaQLHierarchyResultParser'
import { EvitaQLAttributeHistogramsResultParser } from '@/modules/evitaql-console/console/result-visualiser/service/EvitaQLAttributeHistogramsResultParser'
import { EvitaQLPriceHistogramResultParser } from '@/modules/evitaql-console/console/result-visualiser/service/EvitaQLPriceHistogramResultParser'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { mandatoryInject } from '@/utils/reactivity'

export const evitaQLResultVisualiserServiceInjectionKey: InjectionKey<EvitaQLResultVisualiserService> = Symbol('evitaQLResultVisualiserService')

export function useEvitaQLResultVisualiserService(): EvitaQLResultVisualiserService {
    return mandatoryInject(evitaQLResultVisualiserServiceInjectionKey) as EvitaQLResultVisualiserService
}

export class EvitaQLResultVisualiserService implements ResultVisualiserService {
    readonly resultAnalyzer: ResultAnalyzer<unknown>
    readonly facetSummaryParser: FacetSummaryResultParser<unknown>
    readonly referenceSummaryParser: ReferenceSummaryResultParser<unknown>
    readonly hierarchyParser: HierarchyResultParser<unknown>
    readonly attributeHistogramsParser: AttributeHistogramsResultParser<unknown>
    readonly priceHistogramParser: PriceHistogramResultParser<unknown>

    constructor(evitaClient: EvitaClient) {
        this.resultAnalyzer = new EvitaQLResultAnalyzer(evitaClient)
        this.facetSummaryParser = new EvitaQLFacetSummaryResultParser(evitaClient)
        this.referenceSummaryParser = new EvitaQLReferenceSummaryResultParser(evitaClient)
        this.hierarchyParser = new EvitaQLHierarchyResultParser(evitaClient)
        this.attributeHistogramsParser = new EvitaQLAttributeHistogramsResultParser()
        this.priceHistogramParser = new EvitaQLPriceHistogramResultParser()
    }
}
