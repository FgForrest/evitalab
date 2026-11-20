import { RestOperation } from '@/modules/rest-console/console/model/RestOperation'
import { RestHttpMethod } from '@/modules/database-driver/connector/rest/model/RestHttpMethod'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'

/**
 * A logical REST endpoint as offered in the endpoint picker: an operation together with its localized twin, if any.
 *
 * evitaDB exposes almost every read operation twice — `/Product/query` and `/{locale}/Product/query` (operation ids
 * differing by the `Localized` suffix). The pair is presented as one row with a locale switch; each variant keeps
 * its own parameter list, because the non-localized `get*` variants additionally take `locale` and `dataInLocales`
 * as query parameters.
 */
export class RestEndpoint {
    /**
     * Stable identifier of the endpoint, the operation id without the `Localized` suffix.
     */
    readonly id: string
    readonly groupName: string
    /**
     * Name of the entity collection the endpoint belongs to, `undefined` for catalog-level and system endpoints.
     */
    readonly collectionName: string | undefined
    /**
     * Operation id stripped of the collection name and of the `Localized` suffix (`getById`, `query`, …), used to
     * look up the display name and the ordering.
     */
    readonly operationKey: string
    readonly nonLocalized: RestOperation | undefined
    readonly localized: RestOperation | undefined
    /**
     * The variant shown when no locale is chosen, or the only one there is.
     */
    readonly primary: RestOperation

    constructor(id: string,
                groupName: string,
                collectionName: string | undefined,
                operationKey: string,
                nonLocalized: RestOperation | undefined,
                localized: RestOperation | undefined) {
        this.id = id
        this.groupName = groupName
        this.collectionName = collectionName
        this.operationKey = operationKey
        this.nonLocalized = nonLocalized
        this.localized = localized
        const primary: RestOperation | undefined = nonLocalized ?? localized
        if (primary == undefined) {
            throw new UnexpectedError(`REST endpoint '${id}' has no operation.`)
        }
        this.primary = primary
    }

    get method(): RestHttpMethod {
        return this.primary.method
    }

    get hasLocalizedVariant(): boolean {
        return this.localized != undefined
    }

    get hasBody(): boolean {
        return this.primary.hasBody
    }

    /**
     * Returns the variant to be used for the given locale (`undefined` = not localized).
     */
    variant(locale: string | undefined): RestOperation {
        if (locale != undefined && this.localized != undefined) {
            return this.localized
        }
        return this.primary
    }

    /**
     * Whether one of the variants has the given operation id.
     */
    hasOperation(operationId: string): boolean {
        return this.nonLocalized?.operationId === operationId || this.localized?.operationId === operationId
    }
}
