import { EntityIndexType } from '@/modules/database-driver/request-response/statistics/EntityIndexType'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope'

/**
 * Number of indexes of one type within one scope.
 */
export class IndexTypeCount {

    readonly indexType: EntityIndexType
    readonly scope: EntityScope
    readonly count: number

    constructor(indexType: EntityIndexType, scope: EntityScope, count: number) {
        this.indexType = indexType
        this.scope = scope
        this.count = count
    }
}
