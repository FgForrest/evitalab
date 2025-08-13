import { List as ImmutableList } from 'immutable'
import { ChangeCaptureOperation } from '@/modules/database-driver/request-response/change-capture/ChangeCaptureOperation'
import { ChangeCaptureContainerType } from '@/modules/database-driver/request-response/change-capture/ChangeCaptureContainerType'

/**
 * Record describing the location and form of the change capture data event in the evitaDB that should be captured.
 */
export class ChangeCaptureDataSite {
    /**
     * The name of the intercepted entity type
     */
    readonly entityType?: string
    /**
     * The primary key of the intercepted entity
     */
    readonly entityPrimaryKey?: number
    /**
     * The intercepted type of operation
     */
    readonly operation: ImmutableList<ChangeCaptureOperation>
    /**
     * The name of the intercepted container type
     */
    readonly containerType: ImmutableList<ChangeCaptureContainerType>
    /**
     * The name of the container (e.g. attribute name, associated data name, reference name)
     */
    readonly containerName: ImmutableList<string>

    constructor(entityType: string | undefined,
                entityPrimaryKey: number | undefined,
                operation: ImmutableList<ChangeCaptureOperation>,
                containerType: ImmutableList<ChangeCaptureContainerType>,
                containerName: ImmutableList<string>) {
        this.entityType = entityType
        this.entityPrimaryKey = entityPrimaryKey
        this.operation = operation
        this.containerType = containerType
        this.containerName = containerName
    }
}