import { List, Map } from 'immutable'
import { LevelInfo } from '@/modules/database-driver/request-response/data/LevelInfo'

/**
 * This DTO contains hierarchical structure of entities either directly queried or referenced by the entities targeted
 * by the query. It copies hierarchical structure of those entities and contains their identification or full body as
 * well as information on cardinality of referencing entities.
 */
export class Hierarchy {
    readonly hierarchy: Map<string, List<LevelInfo>>

    constructor(hierarchy: Map<string, List<LevelInfo>>){
        this.hierarchy = hierarchy
    }
}
