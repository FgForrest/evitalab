import { type Operation } from '@/modules/database-driver/request-response/cdc/Operation.ts'
import type { Mutation } from '@/modules/database-driver/request-response/Mutation.ts'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime.ts'

export class ChangeSystemCapture {
    /** The version of the engine where the operation was performed */
    version: string
    /** The index of the event within the enclosed transaction, index 0 is the transaction lead event */
    index: number
    /** The operation that was performed */
    operation: Operation
    /** Optional body of the operation when it is requested by the GrpcContent */
    systemMutation: Mutation | undefined
    /** Represents the timestamp of the commit */
    timestamp: OffsetDateTime | undefined

    constructor(
        version: string,
        index: number,
        operation: Operation,
        systemMutation: Mutation | undefined,
        timestamp?: OffsetDateTime
    ) {
        this.version = version
        this.index = index
        this.operation = operation
        this.systemMutation = systemMutation
        this.timestamp = timestamp
    }
}
