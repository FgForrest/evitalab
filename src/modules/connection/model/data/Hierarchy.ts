import { Value } from "../Value";
import { List, Map } from 'immutable'
import { LevelInfo } from '@/modules/connection/model/data/LevelInfo'

//TODO: Add documentation
export class Hierarchy {
    readonly hierarchy: Value<Map<string, List<LevelInfo>>>

    constructor(hierarchy: Value<Map<string, List<LevelInfo>>>){
        this.hierarchy = hierarchy
    }
}
