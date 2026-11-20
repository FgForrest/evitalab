import { List as ImmutableList } from 'immutable'
import { RestHttpMethod } from '@/modules/database-driver/connector/rest/model/RestHttpMethod'
import { RestParameter } from '@/modules/rest-console/console/model/RestParameter'

/**
 * A single operation (path + method) of a REST API, as declared by the OpenAPI specification.
 */
export class RestOperation {
    readonly operationId: string
    readonly method: RestHttpMethod
    /**
     * Templated path relative to the API instance (`/{locale}/Product/get/{primaryKey}`).
     */
    readonly pathTemplate: string
    readonly description: string | undefined
    /**
     * Path parameters first, then query parameters, each in the order of the specification.
     */
    readonly parameters: ImmutableList<RestParameter>
    /**
     * Whether the operation accepts a JSON body. evitaDB never marks a body as required, so this is all that can
     * be known about it.
     */
    readonly hasBody: boolean
    /**
     * Name of the body schema component, for display.
     */
    readonly bodySchemaName: string | undefined

    constructor(operationId: string,
                method: RestHttpMethod,
                pathTemplate: string,
                description: string | undefined,
                parameters: ImmutableList<RestParameter>,
                hasBody: boolean,
                bodySchemaName: string | undefined) {
        this.operationId = operationId
        this.method = method
        this.pathTemplate = pathTemplate
        this.description = description
        this.parameters = parameters
        this.hasBody = hasBody
        this.bodySchemaName = bodySchemaName
    }

    /**
     * Whether the operation is an entity query (`query<EntityType>`), the only kind that returns extra results and
     * can collect query telemetry.
     */
    get isQuery(): boolean {
        return this.operationId.startsWith('query')
    }
}
