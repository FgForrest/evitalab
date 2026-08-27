import { List } from "immutable";
import { EntityReference } from "./EntityReference";

/**
 * This DTO represents single hierarchical entity in the statistics tree. It contains identification of the entity,
 * the cardinality of queried entities that refer to it and information about children level.
 */
export class LevelInfo {
    /**
     * The entity this node stands for. It is a full {@link Entity} when the query asked for its body and a bare
     * {@link EntityReference} otherwise, which is why it is typed by their common ancestor - the server sends
     * exactly one of the two.
     */
    readonly entity: EntityReference | undefined
    readonly queriedEntityCount: number| undefined
    readonly childrenCount: number | undefined
    readonly children: List<LevelInfo>
    readonly requested: boolean

    constructor(children: List<LevelInfo>,
                requested: boolean,
                childrenCount: number | undefined,
                queriedEntityCount: number | undefined,
                entity: EntityReference | undefined){
        this.children = children
        this.requested = requested
        this.childrenCount = childrenCount
        this.queriedEntityCount = queriedEntityCount
        this.entity = entity
    }
}
