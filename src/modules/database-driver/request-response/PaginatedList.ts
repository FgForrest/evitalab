import { List as ImmutableList } from 'immutable'

/**
 * Universal immutable simple paginated list implementation. Contains information about
 * paging.
 */
export class PaginatedList<T> implements Iterable<T> {

    readonly data: ImmutableList<T>
    readonly pageNumber: number
    readonly pageSize: number
    readonly totalNumberOfRecords: number

    constructor(data: ImmutableList<T>,
                pageNumber: number,
                pageSize: number,
                totalNumberOfRecords: number) {
        this.data = data
        this.pageNumber = pageNumber
        this.pageSize = pageSize
        this.totalNumberOfRecords = totalNumberOfRecords
    }

    [Symbol.iterator](): Iterator<T> {
        let index: number = 0
        return {
            next: () => {
                return {
                    done: index > this.data.size,
                    value: this.data.get(index++)!
                }
            }
        }
    }
}
