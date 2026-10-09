/**
 * How many entities a catalog holds, split by scope. `totalRecords` counts entity body storage parts and archiving
 * does not remove one, so it is live plus archived combined.
 */
export class RecordCounts {

    readonly totalRecords: bigint
    readonly liveRecords: bigint
    readonly archivedRecords: bigint

    constructor(totalRecords: bigint, liveRecords: bigint, archivedRecords: bigint) {
        this.totalRecords = totalRecords
        this.liveRecords = liveRecords
        this.archivedRecords = archivedRecords
    }
}
