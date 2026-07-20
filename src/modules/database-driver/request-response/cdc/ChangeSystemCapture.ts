import type { Operation } from '@/modules/database-driver/request-response/cdc/Operation.ts'
import type { SchemaMutation } from '@/modules/database-driver/request-response/schema/mutation/SchemaMutation.ts'
import type { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime.ts'

/**
 * Internal counterpart of the gRPC `GrpcChangeSystemCapture`. Represents a single engine-level
 * (system) CDC event, e.g. a catalog create/drop/rename/state/schema change.
 */
export class ChangeSystemCapture {
    /** The version of the engine where the operation was performed. */
    readonly version: number
    /** The index of the event within the enclosed transaction, index 0 is the transaction lead event. */
    readonly index: number
    /** The operation that was performed. */
    readonly operation: Operation
    /** The converted engine mutation carrying the operation details (present only when the capture body is requested). */
    readonly body: SchemaMutation | undefined
    /** The timestamp of the commit. */
    readonly timestamp: OffsetDateTime | undefined

    constructor(
        version: number,
        index: number,
        operation: Operation,
        body: SchemaMutation | undefined,
        timestamp: OffsetDateTime | undefined
    ) {
        this.version = version
        this.index = index
        this.operation = operation
        this.body = body
        this.timestamp = timestamp
    }
}
