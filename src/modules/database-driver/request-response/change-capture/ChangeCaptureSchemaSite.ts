import { List as ImmutableList } from 'immutable'
import { ChangeCaptureOperation } from '@/modules/database-driver/request-response/change-capture/ChangeCaptureOperation'
import { ChangeCaptureContainerType } from '@/modules/database-driver/request-response/change-capture/ChangeCaptureContainerType'

/**
 * Record describing the location and form of the change capture schema event in the evitaDB that should be captured.
 */
export class ChangeCaptureSchemaSite {
    /**
     * The name of intercepted entity
     */
    readonly entityType?: string
    /**
     * The intercepted type of operation
     */
    readonly operation: ImmutableList<ChangeCaptureOperation>
    /**
     * The name of the intercepted container type
     */
    readonly containerType: ImmutableList<ChangeCaptureContainerType>

    constructor(entityType: string | undefined,
                operation: ImmutableList<ChangeCaptureOperation>,
                containerType: ImmutableList<ChangeCaptureContainerType>) {
        this.entityType = entityType
        this.operation = operation
        this.containerType = containerType
    }
}