import { EngineMutation } from '@/modules/database-driver/request-response/cdc/EngineMutation.ts'
import type { Uuid } from '@/modules/database-driver/data-type/Uuid.ts'
import type { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime.ts'

export class TransactionMutation extends EngineMutation {
    readonly kind = 'transactionMutation'
    readonly version: string
    readonly mutationCount: number
    readonly walSizeInBytes: string
    readonly transactionId?: Uuid
    readonly commitTimestamp?: OffsetDateTime

    constructor(
        version: string,
        mutationCount: number,
        walSizeInBytes: string,
        transactionId?: Uuid,
        commitTimestamp?: OffsetDateTime,
    ) {
        super()
        this.version = version
        this.mutationCount = mutationCount
        this.walSizeInBytes = walSizeInBytes
        this.transactionId = transactionId
        this.commitTimestamp = commitTimestamp
    }
}
