import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime.ts'

export class TransactionMutation {
    readonly transactionId: string
    readonly version: number
    readonly mutationCount: number
    readonly walSizeInBytes: number
    readonly commitTimestamp: OffsetDateTime

    constructor(
        transactionId: string,
        version: number,
        mutationCount: number,
        walSizeInBytes: number,
        commitTimestamp: OffsetDateTime
    ) {
        this.transactionId = transactionId
        this.version = version
        this.mutationCount = mutationCount
        this.walSizeInBytes = walSizeInBytes
        this.commitTimestamp = commitTimestamp
    }
}
