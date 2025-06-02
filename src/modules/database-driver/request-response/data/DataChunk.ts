import { Entity } from '@/modules/database-driver/request-response/data/Entity'

/**
 * evitaLab's representation of a data chunk independent of specific evitaDB version
 */
export abstract class DataChunk {

    readonly data: Entity[]

    readonly totalRecordCount: number
    readonly first: boolean
    readonly last: boolean
    readonly hasPrevious: boolean
    readonly hasNext: boolean
    readonly singlePage: boolean
    readonly empty: boolean

    protected constructor(data: Entity[],
                          totalRecordCount: number,
                          first: boolean,
                          last: boolean,
                          hasPrevious: boolean,
                          hasNext: boolean,
                          singlePage: boolean,
                          empty: boolean) {
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
