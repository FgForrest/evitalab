import { List, Map } from "immutable"
import { Histogram } from "./Histogram"
import { FacetGroupStatistics } from "./FacetGroupStatistics"
import { Hierarchy } from "./Hierarchy"

/**
 * Contains additional computed data from entities.
 */
export class ExtraResults {
    readonly attributeHistogram: Map<string, Histogram> | undefined
    readonly priceHistogram: Histogram | undefined
    readonly facetGroupStatistics: List<FacetGroupStatistics>| undefined
    readonly selfHierarchy: Hierarchy | undefined
    readonly hierarchy: Map<string, Hierarchy> | undefined

    constructor(attributeHistogram: Map<string, Histogram> | undefined,
                facetGroupStatistics: List<FacetGroupStatistics> | undefined,
                hierarchy: Map<string, Hierarchy> | undefined,
                priceHistogram: Histogram | undefined,
                selfHierarchy: Hierarchy | undefined){
        this.attributeHistogram = attributeHistogram
        this.facetGroupStatistics = facetGroupStatistics
        this.hierarchy = hierarchy
        this.priceHistogram = priceHistogram
        this.selfHierarchy = selfHierarchy
    }
}
