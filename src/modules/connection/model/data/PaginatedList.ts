import { DataChunk } from '@/modules/connection/model/data/DataChunk'
import { Entity } from '@/modules/connection/model/data/Entity'
import { Value } from '@/modules/connection/model/Value'

/**
 * evitaLab's representation of a paginated list independent of specific evitaDB version
 */
export class PaginatedList extends DataChunk {
    readonly pageSize: Value<number>
    readonly pageNumber: Value<number>
    private _lastPageItemNumber: Value<number | null> = Value.of(null)
    private _firstPageItemNumber: Value<number | null> = Value.of(null)
    private _lastPageNumber: Value<number | null> = Value.of(null)

    constructor(
        data: Value<Entity[]>,
        totalRecordCount: Value<number>,
        first: Value<boolean>,
        last: Value<boolean>,
        hasPrevious: Value<boolean>,
        hasNext: Value<boolean>,
        singlePage: Value<boolean>,
        empty: Value<boolean>,
        pageSize: Value<number>,
        pageNumber: Value<number>
    ) {
        super(
            data,
            totalRecordCount,
            first,
            last,
            hasPrevious,
            hasNext,
            singlePage,
            empty
        )
        this.pageSize = pageSize
        this.pageNumber = pageNumber
    }

    public get lastPageNumber() {
        if (!this.lastPageNumber.getIfSupported()) {
            this._lastPageNumber = Value.of(
                this.getLastPageNumber(
                    this.totalRecordCount.getIfSupported() ?? 0,
                    this.pageSize.getIfSupported() ?? 0
                )
            )
        }
        return this._lastPageNumber
    }

    public get firstPageItemNumber() {
        if (!this._firstPageItemNumber.getIfSupported()) {
            this._firstPageItemNumber = Value.of(
                this.getFirstPageItemNumber(
                    this.pageNumber.getIfSupported() ?? 0,
                    this.pageSize.getIfSupported() ?? 0,
                    this.totalRecordCount.getIfSupported() ?? 0
                )
            )
        }
        return this._firstPageItemNumber
    }

    public get lastPageItemNumber() {
        if (!this._lastPageItemNumber.getIfSupported()) {
            this._lastPageItemNumber = Value.of(
                this.getLastPageItemNumber(
                    this.pageNumber.getIfSupported() ?? 0,
                    this.pageSize.getIfSupported() ?? 0,
                    this.totalRecordCount.getIfSupported() ?? 0
                )
            )
        }
        return this._lastPageItemNumber
    }

    private getLastPageNumber(
        totalRecordCount: number,
        pageSize: number
    ): number {
        return Math.ceil(totalRecordCount / pageSize)
    }

    private getFirstPageItemNumber(
        pageNumber: number,
        pageSize: number,
        totalRecordCount: number
    ): number {
        if (
            this.isRequestedResultBehindLimit(
                pageNumber,
                pageSize,
                totalRecordCount
            )
        ) {
            return 0
        }
        return this.getFirstItemNumberForPage(pageNumber, pageSize)
    }

    private isRequestedResultBehindLimit(
        pageNumber: number,
        pageSize: number,
        totalRecordCount: number
    ): boolean {
        return (pageNumber - 1) * pageSize + 1 > totalRecordCount
    }

    private getFirstItemNumberForPage(
        pageNumber: number,
        pageSize: number
    ): number {
        const firstRecord = (pageNumber - 1) * pageSize
        return Math.max(firstRecord, 0)
    }

    getLastPageItemNumber(
        pageNumber: number,
        pageSize: number,
        totalRecordCount: number
    ): number {
        const result = pageNumber * pageSize - 1
        return Math.min(result, totalRecordCount)
    }

    static empty(): PaginatedList {
        return new PaginatedList(
            Value.of([]),
            Value.of(0),
            Value.of(true),
            Value.of(false),
            Value.of(false),
            Value.of(false),
            Value.of(true),
            Value.of(true),
            Value.of(1),
            Value.of(20)
        )
    }
}
