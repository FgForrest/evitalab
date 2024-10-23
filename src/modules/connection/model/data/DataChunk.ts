import { Entity } from '@/modules/connection/model/data/Entity'
import { Value } from '@/modules/connection/model/Value'

/**
 * evitaLab's representation of a data chunk independent of specific evitaDB version
 */
export abstract class DataChunk {

    readonly data: Value<Entity[]>

    readonly totalRecordCount: Value<number>
    readonly first: Value<boolean>
    readonly last: Value<boolean>
    readonly hasPrevious: Value<boolean>
    readonly hasNext: Value<boolean>
    readonly singlePage: Value<boolean>
    readonly empty: Value<boolean>

    protected constructor(data: Value<Entity[]>,
                          totalRecordCount: Value<number>,
                          first: Value<boolean>,
                          last: Value<boolean>,
                          hasPrevious: Value<boolean>,
                          hasNext: Value<boolean>,
                          singlePage: Value<boolean>,
                          empty: Value<boolean>) {
        this.data = data
        this.totalRecordCount = totalRecordCount
        this.first = first
        this.last = last
        this.hasPrevious = hasPrevious
        this.hasNext = hasNext
        this.singlePage = singlePage
        this.empty = empty
    }
}
