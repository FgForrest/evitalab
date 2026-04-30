import { List, Map } from "immutable"
import { Histogram } from "./Histogram"
import { FacetGroupStatistics } from "./FacetGroupStatistics"
import { ReferenceGroupStatistics } from "./ReferenceGroupStatistics"
import { Hierarchy } from "./Hierarchy"

/**
 * Contains additional computed data from entities.
 */
export class ExtraResults {
    readonly attributeHistogram: Map<string, Histogram> | undefined
    readonly priceHistogram: Histogram | undefined
    readonly facetGroupStatistics: List<FacetGroupStatistics>| undefined
    readonly referenceGroupStatistics: List<ReferenceGroupStatistics> | undefined
    readonly selfHierarchy: Hierarchy | undefined
    readonly hierarchy: Map<string, Hierarchy> | undefined

    constructor(attributeHistogram: Map<string, Histogram> | undefined,
                facetGroupStatistics: List<FacetGroupStatistics> | undefined,
                referenceGroupStatistics: List<ReferenceGroupStatistics> | undefined,
                hierarchy: Map<string, Hierarchy> | undefined,
                priceHistogram: Histogram | undefined,
                selfHierarchy: Hierarchy | undefined){
        this.attributeHistogram = attributeHistogram
        this.facetGroupStatistics = facetGroupStatistics
        this.referenceGroupStatistics = referenceGroupStatistics
        this.hierarchy = hierarchy
        this.priceHistogram = priceHistogram
        this.selfHierarchy = selfHierarchy
    }
}
