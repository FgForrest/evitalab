import { Value } from "../Value";
import { Entity } from "./Entity";
import { EntityReference } from "./EntityReference";

//TODO: Add documentation
export class FacetStatistics {
    readonly facetEntityReference: Value<EntityReference | undefined>
    readonly facetEntity: Value<Entity | undefined>
    readonly requested: Value<boolean>
    readonly count: Value<number>
    readonly impact: Value<number | undefined>
    readonly matchCount: Value<number | undefined>
    readonly hasSense: Value<boolean>

    constructor(requested: Value<boolean>, count: Value<number>, hasSense: Value<boolean>, facetEntity: Value<Entity | undefined>, impact: Value<number | undefined>, matchCount: Value<number | undefined>, facetEntityReference: Value<EntityReference | undefined>){
        this.facetEntityReference = facetEntityReference
        this.facetEntity = facetEntity
        this.requested = requested
        this.count = count
        this.impact = impact
        this.matchCount = matchCount
        this.hasSense = hasSense
    }
}
