import { Entity } from "./Entity";
import { EntityReference } from "./EntityReference";

/**
 * This DTO contains information about single facet statistics of the entities that are present in the response.
 */
export class FacetStatistics {
    readonly facetEntityReference: EntityReference | undefined
    readonly facetEntity: Entity | undefined
    readonly requested: boolean
    readonly count: number
    readonly impact: number | undefined
    readonly matchCount: number | undefined
    readonly hasSense: boolean

    constructor(requested: boolean,
                count: number,
                hasSense: boolean,
                facetEntity: Entity | undefined,
                impact: number | undefined,
                matchCount: number | undefined,
                facetEntityReference: EntityReference | undefined){
        this.facetEntityReference = facetEntityReference
        this.facetEntity = facetEntity
        this.requested = requested
        this.count = count
        this.impact = impact
        this.matchCount = matchCount
        this.hasSense = hasSense
    }
}
