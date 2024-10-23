import { Entity } from "./Entity"
import { EntityReference } from "./EntityReference"
import { List } from "immutable"
import { FacetStatistics } from "./FacetStatistics"
import { Value } from "../Value"

//TODO: Add documentation
export class FacetGroupStatistics {
    readonly referenceName: string
    readonly groupEntityReference: Value<EntityReference | undefined>
    readonly groupEntity: Value<Entity | undefined>
    readonly count: Value<number>
    readonly facetStatistics: Value<List<FacetStatistics>>

    constructor(referenceName: string, count: Value<number>, facetStatistics: Value<List<FacetStatistics>>, groupEntityReference: Value<EntityReference | undefined>, groupEntity: Value<Entity | undefined>){
        this.referenceName = referenceName
        this.count = count
        this.facetStatistics = facetStatistics
        this.groupEntityReference = groupEntityReference
        this.groupEntity = groupEntity
    }
}
