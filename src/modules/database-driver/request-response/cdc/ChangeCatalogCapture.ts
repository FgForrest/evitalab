import type { ChangeCaptureArea } from '@/modules/database-driver/request-response/cdc/ChangeCaptureArea.ts'
import type { ChangeCaptureOperation } from '@/modules/database-driver/request-response/cdc/ChangeCaptureOperation.ts'
import type { EntitySchemaMutation } from '@/modules/database-driver/request-response/cdc/EntitySchemaMutation.ts'
import type { EntityMutation } from '@/modules/database-driver/request-response/cdc/EntityMutation.ts'
import type { LocalMutation } from '@/modules/database-driver/request-response/cdc/LocalMutation.ts'

export class ChangeCatalogCapture {
    /** the version of the catalog where the operation was performed (int64 as string) */
    readonly version: string
    /** the index of the event within the enclosed transaction (0 = lead event) */
    readonly index: number
    /** the area of the operation */
    readonly area: ChangeCaptureArea
    /** the name of the entity type or its schema that was affected by the operation */
    readonly entityType?: string
    /** the primary key of the entity that was affected by the operation (null for schema operations) */
    readonly entityPrimaryKey?: number
    /** the operation that was performed */
    readonly operation: ChangeCaptureOperation
    /** optional body of the operation when it is requested by the content */
    readonly schemaMutation?: EntitySchemaMutation
    /** optional body of the operation when it is requested by the content */
    readonly entityMutation?: EntityMutation
    /** optional body of the operation when it is requested by the content */
    readonly localMutation?: LocalMutation

    constructor(
        version: string,
        index: number,
        area: ChangeCaptureArea,
        operation: ChangeCaptureOperation,
        entityType?: string,
        entityPrimaryKey?: number,
        body?: { schemaMutation: EntitySchemaMutation } | { entityMutation: EntityMutation } | { localMutation: LocalMutation }
    ) {
        this.version = version
        this.index = index
        this.area = area
        this.entityType = entityType
        this.entityPrimaryKey = entityPrimaryKey
        this.operation = operation
        if (body) {
            if ('schemaMutation' in body) this.schemaMutation = body.schemaMutation
            if ('entityMutation' in body) this.entityMutation = body.entityMutation
            if ('localMutation' in body) this.localMutation = body.localMutation
        }
    }
}
