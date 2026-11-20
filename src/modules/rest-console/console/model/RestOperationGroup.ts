import { List as ImmutableList } from 'immutable'
import { RestEndpoint } from '@/modules/rest-console/console/model/RestEndpoint'

/**
 * Endpoints of one entity collection, of the catalog itself or of the system API, as grouped in the endpoint picker.
 */
export class RestOperationGroup {
    readonly name: string
    /**
     * Whether the group is the catalog-level group (or the system group) rather than an entity collection; its
     * label is localized instead of being the collection name.
     */
    readonly generic: boolean
    readonly endpoints: ImmutableList<RestEndpoint>

    constructor(name: string, generic: boolean, endpoints: ImmutableList<RestEndpoint>) {
        this.name = name
        this.generic = generic
        this.endpoints = endpoints
    }
}
