/**
 * Record describing the location and form of the CDC data event in the evitaDB that should be captured.
 * String model equivalent of GrpcChangeCaptureDataSite
 */
import type { ChangeCaptureOperation } from '@/modules/database-driver/request-response/cdc/ChangeCaptureOperation.ts'
import type { ChangeCaptureContainerType } from '@/modules/database-driver/request-response/cdc/ChangeCaptureContainerType.ts'

export class ChangeCaptureDataSite {
    /** The name of the intercepted entity type. */
    readonly entityType?: string
    /** The primary key of the intercepted entity. */
    readonly entityPrimaryKey?: number
    /** The intercepted type(s) of operation. */
    readonly operation: ChangeCaptureOperation[]
    /** The name(s) of the intercepted container type. */
    readonly containerType: ChangeCaptureContainerType[]
    /** The name(s) of the container (e.g. attribute name, associated data name, reference name). */
    readonly containerName: string[]

    constructor(
        operation: ChangeCaptureOperation[],
        containerType: ChangeCaptureContainerType[],
        containerName: string[] = [],
        entityType?: string,
        entityPrimaryKey?: number,
    ) {
        this.entityType = entityType
        this.entityPrimaryKey = entityPrimaryKey
        this.operation = operation
        this.containerType = containerType
        this.containerName = containerName
    }
}
