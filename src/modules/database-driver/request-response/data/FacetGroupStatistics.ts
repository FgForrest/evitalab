import { Entity } from "./Entity"
import { EntityReference } from "./EntityReference"
import { List } from "immutable"
import { FacetStatistics } from "./FacetStatistics"

/**
 * This DTO contains information about single facet group and statistics of the facets that relates to it.
 */
export class FacetGroupStatistics {
    readonly referenceName: string
    readonly groupEntityReference: EntityReference | undefined
    readonly groupEntity: Entity | undefined
    readonly count: number
    readonly facetStatistics: List<FacetStatistics>

    constructor(referenceName: string,
                count: number,
                facetStatistics: List<FacetStatistics>,
                groupEntityReference: EntityReference | undefined,
                groupEntity: Entity | undefined){
        this.referenceName = referenceName
        this.count = count
        this.facetStatistics = facetStatistics
        this.groupEntityReference = groupEntityReference
        this.groupEntity = groupEntity
    }
}
