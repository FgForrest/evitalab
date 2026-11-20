import { List as ImmutableList } from 'immutable'
import { RestHttpMethod } from '@/modules/database-driver/connector/rest/model/RestHttpMethod'

/**
 * A single query parameter of a {@link RestRequest}. Array parameters are represented by repeating the name.
 */
export type RestQueryParameter = readonly [name: string, value: string]

/**
 * A request to one evitaDB REST API instance, fully resolved: path parameters are already substituted and only
 * the query parameters that are to be sent are present.
 */
export class RestRequest {
    readonly method: RestHttpMethod
    /**
     * Path relative to the REST API instance, starting with `/`, with path parameters already substituted and
     * encoded.
     */
    readonly path: string
    readonly queryParameters: ImmutableList<RestQueryParameter>
    /**
     * JSON body, `undefined` when nothing is to be sent.
     */
    readonly body: string | undefined

    constructor(method: RestHttpMethod,
                path: string,
                queryParameters: ImmutableList<RestQueryParameter> = ImmutableList(),
                body: string | undefined = undefined) {
        this.method = method
        this.path = path
        this.queryParameters = queryParameters
        this.body = body
    }

    /**
     * Encoded query string without the leading `?`, empty when there are no query parameters. Array values are
     * sent as repeated keys (`scope=LIVE&scope=ARCHIVED`), which is how evitaDB reads them.
     */
    get queryString(): string {
        return this.queryParameters
            .map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
            .join('&')
    }

    /**
     * Path including the query string, relative to the REST API instance.
     */
    get pathWithQuery(): string {
        const queryString: string = this.queryString
        return queryString.length > 0 ? `${this.path}?${queryString}` : this.path
    }
}
