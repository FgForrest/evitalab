import { List } from "immutable";
import { Entity } from "./Entity";
import { EntityReference } from "./EntityReference";
import { Value } from "../Value";

//TODO: Add documentation
export class LevelInfo{
    // todo lho merge entity and entity reference
    readonly entityReference: Value<EntityReference| undefined>
    readonly entity: Value<Entity| undefined>
    readonly queriedEntityCount: Value<number| undefined>
    readonly childrenCount: Value<number | undefined>
    readonly children: Value<List<LevelInfo>>
    readonly requested: Value<boolean>

    constructor(children: Value<List<LevelInfo>>, requested: Value<boolean>, childrenCount: Value<number | undefined>, queriedEntityCount: Value<number | undefined>, entity: Value<Entity | undefined>, entityReference: Value<EntityReference | undefined>){
        this.children = children
        this.requested = requested
        this.childrenCount = childrenCount
        this.queriedEntityCount = queriedEntityCount
        this.entity = entity
        this.entityReference = entityReference
    }
}
