import { List } from "immutable";
import { Entity } from "./Entity";
import { EntityReference } from "./EntityReference";

/**
 * This DTO represents single hierarchical entity in the statistics tree. It contains identification of the entity,
 * the cardinality of queried entities that refer to it and information about children level.
 */
export class LevelInfo {
    // todo lho merge entity and entity reference
    readonly entityReference: EntityReference | undefined
    readonly entity: Entity| undefined
    readonly queriedEntityCount: number| undefined
    readonly childrenCount: number | undefined
    readonly children: List<LevelInfo>
    readonly requested: boolean

    constructor(children: List<LevelInfo>,
                requested: boolean,
                childrenCount: number | undefined,
                queriedEntityCount: number | undefined,
                entity: Entity | undefined,
                entityReference: EntityReference | undefined){
        this.children = children
        this.requested = requested
        this.childrenCount = childrenCount
        this.queriedEntityCount = queriedEntityCount
        this.entity = entity
        this.entityReference = entityReference
    }
}
