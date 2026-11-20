import { List, Map } from "immutable"
import { Histogram } from "./Histogram"
import { FacetGroupStatistics } from "./FacetGroupStatistics"
import { ReferenceGroupStatistics } from "./ReferenceGroupStatistics"
import { Hierarchy } from "./Hierarchy"
import { QueryTelemetry } from "./QueryTelemetry"

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
    /**
     * Root ({@link QueryPhase.Overall}) step of the query telemetry tree, present when the query asked for
     * `queryTelemetry`.
     */
    readonly queryTelemetry: QueryTelemetry | undefined

    constructor(attributeHistogram: Map<string, Histogram> | undefined,
                facetGroupStatistics: List<FacetGroupStatistics> | undefined,
                referenceGroupStatistics: List<ReferenceGroupStatistics> | undefined,
                hierarchy: Map<string, Hierarchy> | undefined,
                priceHistogram: Histogram | undefined,
                selfHierarchy: Hierarchy | undefined,
                queryTelemetry: QueryTelemetry | undefined = undefined){
        this.attributeHistogram = attributeHistogram
        this.facetGroupStatistics = facetGroupStatistics
        this.referenceGroupStatistics = referenceGroupStatistics
        this.hierarchy = hierarchy
        this.priceHistogram = priceHistogram
        this.selfHierarchy = selfHierarchy
        this.queryTelemetry = queryTelemetry
    }
}
