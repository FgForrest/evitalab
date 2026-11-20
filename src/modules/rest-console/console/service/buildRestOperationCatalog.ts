import { List as ImmutableList } from 'immutable'
import type { RestOpenApiDocument } from '@/modules/database-driver/connector/rest/model/RestOpenApi'
import { RestInstanceType } from '@/modules/database-driver/connector/rest/model/RestInstanceType'
import {
    RestHttpMethod,
    restHttpMethodFromOpenApiKey
} from '@/modules/database-driver/connector/rest/model/RestHttpMethod'
import { RestOperationCatalog } from '@/modules/rest-console/console/model/RestOperationCatalog'
import { RestOperationGroup } from '@/modules/rest-console/console/model/RestOperationGroup'
import { RestEndpoint } from '@/modules/rest-console/console/model/RestEndpoint'
import { RestOperation } from '@/modules/rest-console/console/model/RestOperation'
import { RestParameter } from '@/modules/rest-console/console/model/RestParameter'
import { RestParameterKind } from '@/modules/rest-console/console/model/RestParameterKind'
import { RestParameterLocation } from '@/modules/rest-console/console/model/RestParameterLocation'

/**
 * Name of the group holding the catalog-level endpoints (`/schema`, `/entity/*`, `/collections`).
 */
export const restCatalogGroupName: string = 'catalog'
/**
 * Name of the single group of the system API.
 */
export const restSystemGroupName: string = 'system'

/**
 * Paths that are not offered: the specification itself and the change-capture stream, which a request/response
 * console cannot consume.
 */
const excludedPaths: ReadonlySet<string> = new Set(['/', '/change-captures'])

const localePathPrefix: string = '/{locale}'
const localizedOperationSuffix: string = 'Localized'

/**
 * Order of the endpoints within a group, by operation key. Keys not listed here follow, ordered by their path.
 */
const operationKeyOrder: readonly string[] = [
    'query', 'list', 'get', 'getById', 'upsert', 'delete', 'deleteByQuery', 'getSchema', 'updateSchema',
    'getEntity', 'listEntity', 'collections', 'getCatalogSchema', 'updateCatalogSchema',
    'listCatalogs', 'getCatalog', 'createCatalog', 'updateCatalog', 'deleteCatalog', 'liveness'
]

/**
 * A JSON object of the specification, walked dynamically.
 */
type JsonObject = Readonly<Record<string, unknown>>

/**
 * Turns an OpenAPI document of an evitaDB REST API instance into the endpoint catalog of the console.
 *
 * - every `(path, method)` except the specification itself and `/change-captures` becomes a {@link RestOperation};
 * - localized twins (`/{locale}/X` + `/X`, operation ids differing by the `Localized` suffix) are merged into one
 *   {@link RestEndpoint} — before grouping, so that the lower-case `/entity/*` twins are merged too;
 * - the catalog API is grouped by entity collection (the first path segment after the optional `{locale}` when it
 *   starts with an upper-case letter), everything else goes to the catalog group placed last; the system API is a
 *   single group.
 */
export function buildRestOperationCatalog(
    document: RestOpenApiDocument,
    instanceType: RestInstanceType
): RestOperationCatalog {
    const paths: JsonObject = asObject(document['paths']) ?? {}

    const operations: RestOperation[] = []
    for (const [path, pathItemValue] of Object.entries(paths)) {
        if (excludedPaths.has(path)) {
            continue
        }
        const pathItem: JsonObject | undefined = asObject(pathItemValue)
        if (pathItem == undefined) {
            continue
        }
        const sharedParameters: unknown[] = asArray(pathItem['parameters']) ?? []
        for (const [key, operationValue] of Object.entries(pathItem)) {
            const method: RestHttpMethod | undefined = restHttpMethodFromOpenApiKey(key)
            const operation: JsonObject | undefined = asObject(operationValue)
            if (method == undefined || operation == undefined) {
                continue
            }
            operations.push(buildOperation(document, path, method, operation, sharedParameters))
        }
    }

    const endpoints: RestEndpoint[] = mergeTwins(operations, instanceType)

    const groupedEndpoints: Map<string, RestEndpoint[]> = new Map()
    for (const endpoint of endpoints) {
        let group: RestEndpoint[] | undefined = groupedEndpoints.get(endpoint.groupName)
        if (group == undefined) {
            group = []
            groupedEndpoints.set(endpoint.groupName, group)
        }
        group.push(endpoint)
    }

    const groups: RestOperationGroup[] = Array.from(groupedEndpoints.entries())
        .map(([name, groupEndpoints]) => new RestOperationGroup(
            name,
            name === restCatalogGroupName || name === restSystemGroupName,
            ImmutableList(groupEndpoints.sort(compareEndpoints))
        ))
        .sort((a, b) => {
            if (a.generic !== b.generic) {
                return a.generic ? 1 : -1
            }
            return a.name.localeCompare(b.name)
        })
    return new RestOperationCatalog(ImmutableList(groups))
}

function buildOperation(document: RestOpenApiDocument,
                        path: string,
                        method: RestHttpMethod,
                        operation: JsonObject,
                        sharedParameters: unknown[]): RestOperation {
    const operationId: string = typeof operation['operationId'] === 'string'
        ? operation['operationId']
        : `${method.toLowerCase()}${path}`

    const parameters: RestParameter[] = [...sharedParameters, ...(asArray(operation['parameters']) ?? [])]
        .map(parameter => buildParameter(document, parameter))
        .filter((parameter): parameter is RestParameter => parameter != undefined)
    // path parameters first, keeping the order of the specification within each location
    const orderedParameters: RestParameter[] = [
        ...parameters.filter(parameter => parameter.location === RestParameterLocation.Path),
        ...parameters.filter(parameter => parameter.location === RestParameterLocation.Query)
    ]

    const requestBody: JsonObject | undefined = asObject(resolveReference(document, operation['requestBody']).value)
    let bodySchemaName: string | undefined = undefined
    if (requestBody != undefined) {
        const content: JsonObject | undefined = asObject(requestBody['content'])
        const jsonContent: JsonObject | undefined = asObject(content?.['application/json'])
        bodySchemaName = resolveReference(document, jsonContent?.['schema']).referenceName
    }

    return new RestOperation(
        operationId,
        method,
        path,
        typeof operation['description'] === 'string' ? operation['description'].trim() : undefined,
        ImmutableList(orderedParameters),
        requestBody != undefined,
        bodySchemaName
    )
}

function buildParameter(document: RestOpenApiDocument, parameterValue: unknown): RestParameter | undefined {
    const parameter: JsonObject | undefined = asObject(resolveReference(document, parameterValue).value)
    if (parameter == undefined || typeof parameter['name'] !== 'string') {
        return undefined
    }
    let location: RestParameterLocation
    switch (parameter['in']) {
        case 'path':
            location = RestParameterLocation.Path
            break
        case 'query':
            location = RestParameterLocation.Query
            break
        default:
            // headers and cookies are not used by evitaDB
            return undefined
    }

    const shape: ParameterShape = resolveParameterShape(document, parameter['schema'])
    const example: unknown = parameter['example'] ?? shape.example
    return new RestParameter(
        parameter['name'],
        location,
        shape.kind,
        location === RestParameterLocation.Path || parameter['required'] === true,
        typeof parameter['description'] === 'string' ? parameter['description'].trim() : undefined,
        shape.enumValues,
        shape.displayType,
        example == undefined ? undefined : String(example)
    )
}

/**
 * What the input of a parameter is derived from.
 */
interface ParameterShape {
    readonly kind: RestParameterKind
    readonly enumValues: ImmutableList<string>
    readonly displayType: string
    readonly example: unknown
}

/**
 * Resolves the kind of a parameter from its schema. A `locale` format wins over `enum` (the `CatalogLocale`
 * enum is a locale, rendered over the catalog's locales); anything not recognized is edited as a plain string with
 * its raw type shown.
 */
function resolveParameterShape(document: RestOpenApiDocument, schemaValue: unknown): ParameterShape {
    const { value, referenceName } = resolveReference(document, schemaValue)
    const schema: JsonObject = asObject(value) ?? {}
    const type: unknown = schema['type']

    if (type === 'array') {
        const itemShape: ParameterShape = resolveParameterShape(document, schema['items'])
        let kind: RestParameterKind
        switch (itemShape.kind) {
            case RestParameterKind.Locale:
                kind = RestParameterKind.LocaleArray
                break
            case RestParameterKind.Enum:
                kind = RestParameterKind.EnumArray
                break
            default:
                kind = RestParameterKind.StringArray
        }
        return {
            kind,
            enumValues: itemShape.enumValues,
            displayType: `array<${itemShape.displayType}>`,
            example: undefined
        }
    }

    const enumValues: ImmutableList<string> = ImmutableList((asArray(schema['enum']) ?? []).map(it => String(it)))
    const format: string | undefined = typeof schema['format'] === 'string' ? schema['format'] : undefined
    const displayType: string = referenceName ?? format ?? (typeof type === 'string' ? type : 'unknown')
    const example: unknown = schema['example']

    let kind: RestParameterKind
    if (format === 'locale') {
        kind = RestParameterKind.Locale
    } else if (enumValues.size > 0) {
        kind = RestParameterKind.Enum
    } else if (type === 'boolean') {
        kind = RestParameterKind.Boolean
    } else if (type === 'integer') {
        kind = RestParameterKind.Integer
    } else if (type === 'number') {
        kind = RestParameterKind.Number
    } else if (type === 'string' && format === 'date-time') {
        kind = RestParameterKind.DateTime
    } else {
        kind = RestParameterKind.String
    }
    return { kind, enumValues, displayType, example }
}

/**
 * Merges localized twins and assigns endpoints to groups.
 */
function mergeTwins(operations: RestOperation[], instanceType: RestInstanceType): RestEndpoint[] {
    const variants: Map<string, { nonLocalized?: RestOperation, localized?: RestOperation }> = new Map()
    for (const operation of operations) {
        const localized: boolean = operation.pathTemplate.startsWith(`${localePathPrefix}/`) &&
            operation.operationId.endsWith(localizedOperationSuffix)
        const id: string = localized
            ? operation.operationId.substring(0, operation.operationId.length - localizedOperationSuffix.length)
            : operation.operationId
        // the method is a part of the identity, so that twins never merge across methods
        const key: string = `${operation.method} ${id}`
        const pair = variants.get(key) ?? {}
        if (localized) {
            pair.localized = operation
        } else {
            pair.nonLocalized = operation
        }
        variants.set(key, pair)
    }

    const endpoints: RestEndpoint[] = []
    for (const pair of variants.values()) {
        const primary: RestOperation | undefined = pair.nonLocalized ?? pair.localized
        if (primary == undefined) {
            continue
        }
        const id: string = pair.nonLocalized?.operationId ?? primary.operationId.replace(/Localized$/, '')
        const collectionName: string | undefined = instanceType === RestInstanceType.Catalog
            ? resolveCollectionName(primary.pathTemplate)
            : undefined
        const groupName: string = instanceType === RestInstanceType.System
            ? restSystemGroupName
            : collectionName ?? restCatalogGroupName
        const operationKey: string = collectionName != undefined ? id.replace(collectionName, '') : id
        endpoints.push(new RestEndpoint(id, groupName, collectionName, operationKey, pair.nonLocalized, pair.localized))
    }
    return endpoints
}

/**
 * Entity collection of a catalog API path, in the PascalCase variant used by REST paths.
 */
function resolveCollectionName(pathTemplate: string): string | undefined {
    const path: string = pathTemplate.startsWith(`${localePathPrefix}/`)
        ? pathTemplate.substring(localePathPrefix.length)
        : pathTemplate
    const firstSegment: string | undefined = path.split('/')[1]
    if (firstSegment == undefined || firstSegment.length === 0) {
        return undefined
    }
    const firstCharacter: string = firstSegment.charAt(0)
    return firstCharacter !== firstCharacter.toLowerCase() ? firstSegment : undefined
}

function compareEndpoints(a: RestEndpoint, b: RestEndpoint): number {
    const rankA: number = operationRank(a.operationKey)
    const rankB: number = operationRank(b.operationKey)
    if (rankA !== rankB) {
        return rankA - rankB
    }
    const pathComparison: number = a.primary.pathTemplate.localeCompare(b.primary.pathTemplate)
    if (pathComparison !== 0) {
        return pathComparison
    }
    return a.method.localeCompare(b.method)
}

function operationRank(operationKey: string): number {
    const index: number = operationKeyOrder.indexOf(operationKey)
    return index >= 0 ? index : operationKeyOrder.length
}

/**
 * Follows a local `$ref` (`#/components/…`) and returns the referenced value together with the name of the last
 * referenced component. Values without a reference are returned as they are.
 */
function resolveReference(document: RestOpenApiDocument, value: unknown): { value: unknown, referenceName: string | undefined } {
    let current: unknown = value
    let referenceName: string | undefined = undefined
    // bounded, so that a cyclic reference cannot loop forever
    for (let depth = 0; depth < 10; depth++) {
        const object: JsonObject | undefined = asObject(current)
        const reference: unknown = object?.['$ref']
        if (typeof reference !== 'string' || !reference.startsWith('#/')) {
            break
        }
        const segments: string[] = reference.substring(2).split('/')
        referenceName = segments.at(-1)
        let target: unknown = document
        for (const segment of segments) {
            target = asObject(target)?.[segment]
        }
        current = target
    }
    return { value: current, referenceName }
}

function asObject(value: unknown): JsonObject | undefined {
    return value != undefined && typeof value === 'object' && !Array.isArray(value)
        ? value as JsonObject
        : undefined
}

function asArray(value: unknown): unknown[] | undefined {
    return Array.isArray(value) ? value : undefined
}
