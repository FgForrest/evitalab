import type { ResultAnalyzer } from './ResultAnalyzer'
import type { FacetSummaryResultParser } from './FacetSummaryResultParser'
import type { ReferenceSummaryResultParser } from './ReferenceSummaryResultParser'
import type { HierarchyResultParser } from './HierarchyResultParser'
import type { AttributeHistogramsResultParser } from './AttributeHistogramsResultParser'
import type { PriceHistogramResultParser } from './PriceHistogramResultParser'

/**
 * Bundles a {@link ResultAnalyzer} with per-type result parsers.
 * Provided to {@link ResultVisualiser} component as a single prop.
 * Each query language module creates its own instance with language-specific implementations.
 */
export interface ResultVisualiserService {
    readonly resultAnalyzer: ResultAnalyzer<unknown>
    readonly facetSummaryParser: FacetSummaryResultParser<unknown>
    readonly referenceSummaryParser: ReferenceSummaryResultParser<unknown>
    readonly hierarchyParser: HierarchyResultParser<unknown>
    readonly attributeHistogramsParser: AttributeHistogramsResultParser<unknown>
    readonly priceHistogramParser: PriceHistogramResultParser<unknown>
}
