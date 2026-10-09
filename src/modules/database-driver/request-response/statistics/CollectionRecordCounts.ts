/**
 * How many entities one collection holds, split by scope.
 */
export class CollectionRecordCounts {

    readonly totalRecords: number
    readonly liveRecords: number
    readonly archivedRecords: number

    constructor(totalRecords: number, liveRecords: number, archivedRecords: number) {
        this.totalRecords = totalRecords
        this.liveRecords = liveRecords
        this.archivedRecords = archivedRecords
    }
}
