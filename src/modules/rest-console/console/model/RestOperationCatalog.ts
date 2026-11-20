import { List as ImmutableList } from 'immutable'
import { RestOperationGroup } from '@/modules/rest-console/console/model/RestOperationGroup'
import { RestEndpoint } from '@/modules/rest-console/console/model/RestEndpoint'
import { RestOperation } from '@/modules/rest-console/console/model/RestOperation'

/**
 * All endpoints of one REST API instance, grouped for the endpoint picker.
 */
export class RestOperationCatalog {
    readonly groups: ImmutableList<RestOperationGroup>

    constructor(groups: ImmutableList<RestOperationGroup>) {
        this.groups = groups
    }

    get endpoints(): ImmutableList<RestEndpoint> {
        return this.groups.flatMap(group => group.endpoints)
    }

    /**
     * Finds the endpoint by its id.
     */
    findEndpoint(endpointId: string): RestEndpoint | undefined {
        return this.endpoints.find(endpoint => endpoint.id === endpointId)
    }

    /**
     * Finds the endpoint one of whose variants has the given operation id.
     */
    findEndpointOfOperation(operationId: string): RestEndpoint | undefined {
        return this.endpoints.find(endpoint => endpoint.hasOperation(operationId))
    }

    /**
     * Finds an operation (variant) by its id.
     */
    findOperation(operationId: string): RestOperation | undefined {
        const endpoint: RestEndpoint | undefined = this.findEndpointOfOperation(operationId)
        if (endpoint == undefined) {
            return undefined
        }
        return endpoint.nonLocalized?.operationId === operationId ? endpoint.nonLocalized : endpoint.localized
    }
}
