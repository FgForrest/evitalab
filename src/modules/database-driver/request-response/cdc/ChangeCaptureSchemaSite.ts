/**
 * Record describing the location and form of the CDC schema event in the evitaDB that should be captured.
 * String model equivalent of GrpcChangeCaptureSchemaSite
 */
import type { ChangeCaptureOperation } from '@/modules/database-driver/request-response/cdc/ChangeCaptureOperation.ts'
import type { ChangeCaptureContainerType } from '@/modules/database-driver/request-response/cdc/ChangeCaptureContainerType.ts'

export class ChangeCaptureSchemaSite {
    /** The name of intercepted entity (entity type). */
    readonly entityType?: string
    /** The intercepted type(s) of operation. */
    readonly operation: ChangeCaptureOperation[]
    /** The name(s) of the intercepted container type. */
    readonly containerType: ChangeCaptureContainerType[]

    constructor(
        operation: ChangeCaptureOperation[],
        containerType: ChangeCaptureContainerType[],
        entityType?: string
    ) {
        this.entityType = entityType
        this.operation = operation
        this.containerType = containerType
    }
}
