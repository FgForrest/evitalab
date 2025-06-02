import { DataChunk } from '@/modules/database-driver/request-response/data/DataChunk'
import { Entity } from '@/modules/database-driver/request-response/data/Entity'

/**
 * evitaLab's representation of a paginated list independent of specific evitaDB version
 */
export class PaginatedList extends DataChunk {

    readonly pageSize: number
    readonly pageNumber: number
    private _lastPageItemNumber: number | undefined = undefined
    private _firstPageItemNumber: number | undefined = undefined
    private _lastPageNumber: number | undefined = undefined

    constructor(
        data: Entity[],
        totalRecordCount: number,
        first: boolean,
        last: boolean,
        hasPrevious: boolean,
        hasNext: boolean,
        singlePage: boolean,
        empty: boolean,
        pageSize: number,
        pageNumber: number
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
        if (this._lastPageNumber == undefined) {
            this._lastPageNumber = this.computeLastPageNumber()
        }
        return this._lastPageNumber
    }

    public get firstPageItemNumber() {
        if (this._firstPageItemNumber == undefined) {
            this._firstPageItemNumber = this.computeFirstPageItemNumber()
        }
        return this._firstPageItemNumber
    }

    public get lastPageItemNumber() {
        if (this._lastPageItemNumber == undefined) {
            this._lastPageItemNumber = this.computeLastPageItemNumber()
        }
        return this._lastPageItemNumber
    }

    private computeLastPageNumber(): number {
        return Math.ceil(this.totalRecordCount / this.pageSize)
    }

    private computeFirstPageItemNumber(): number {
        if (this.isRequestedResultBehindLimit()) {
            return 0
        }
        return this.computeFirstItemNumberForPage()
    }

    private isRequestedResultBehindLimit(): boolean {
        return (this.pageNumber - 1) * this.pageSize + 1 > this.totalRecordCount
    }

    private computeFirstItemNumberForPage(): number {
        const firstRecord = (this.pageNumber - 1) * this.pageSize
        return Math.max(firstRecord, 0)
    }

    private computeLastPageItemNumber(): number {
        const result = this.pageNumber * this.pageSize - 1
        return Math.min(result, this.totalRecordCount)
    }

    static empty(): PaginatedList {
        return new PaginatedList(
            [],
            0,
            true,
            false,
            false,
            false,
            true,
            true,
            1,
            20
        )
    }
}
