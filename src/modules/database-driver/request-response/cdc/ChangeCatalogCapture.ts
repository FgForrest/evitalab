import  { type CaptureArea } from '@/modules/database-driver/request-response/cdc/CaptureArea.ts'
import  { type Operation } from '@/modules/database-driver/request-response/cdc/Operation.ts'
import type { Mutation } from '@/modules/database-driver/request-response/Mutation.ts'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime.ts'

export class ChangeCatalogCapture  {
    /** The version of the catalog where the operation was performed */
    version: number;
    /** The index of the event within the enclosed transaction, index 0 is the transaction lead event */
    index: number;
    /** The area of the operation */
    area: CaptureArea;
    /** The EntitySchema name of the entity or its schema that was affected by the operation */
    entityType: string | undefined;
    /** The primary key of the entity that was affected by the operation */
    entityPrimaryKey: number | undefined;
    /** The operation that was performed */
    operation: Operation;
    /** Optional body of the operation when it is requested by the ChangeSystemCaptureRequest content */
    body: Mutation | undefined; // todo pfi: change it to CatalogBoundMutation

    commitTimestamp: OffsetDateTime | undefined


    constructor(version: number, index: number, area: CaptureArea, entityType: string | undefined, entityPrimaryKey: number | undefined, operation: Operation, body: Mutation | undefined, commitTimestamp: OffsetDateTime | undefined) {
        this.version = version
        this.index = index
        this.area = area
        this.entityType = entityType
        this.entityPrimaryKey = entityPrimaryKey
        this.operation = operation
        this.body = body
        this.commitTimestamp = commitTimestamp
    }
}
