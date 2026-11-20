import { List as ImmutableList } from 'immutable'
import { RestRequest, type RestQueryParameter } from '@/modules/database-driver/connector/rest/model/RestRequest'
import { RestOperation } from '@/modules/rest-console/console/model/RestOperation'
import { RestParameter } from '@/modules/rest-console/console/model/RestParameter'
import { RestParameterKind } from '@/modules/rest-console/console/model/RestParameterKind'
import { RestParameterLocation } from '@/modules/rest-console/console/model/RestParameterLocation'
import {
    isRestParameterValueSet,
    type RestParameterValue,
    type RestParameterValues
} from '@/modules/rest-console/console/model/RestParameterValue'

/**
 * Name of the path parameter of localized operations, which is driven by the console's locale switch rather than
 * by the parameter form.
 */
export const localePathParameterName: string = 'locale'

/**
 * Builds the request for an operation variant from the values of the parameter form.
 *
 * - path parameters are substituted (encoded); the `{locale}` of a localized variant is taken from `locale`,
 *   a path parameter without a value stays as its `{placeholder}`, so that the URL preview can be built while the
 *   form is being filled in;
 * - only query parameters with a value are sent, arrays as repeated keys, in the order of the specification —
 *   evitaDB rejects empty and unknown parameters;
 * - the body is sent only by operations accepting one, and only when it is not blank.
 *
 * Validation is not done here, see {@link validateRestParameterValue}.
 */
export function buildRestRequest(
    operation: RestOperation,
    locale: string | undefined,
    values: RestParameterValues,
    body: string | undefined
): RestRequest {
    let path: string = operation.pathTemplate
    const queryParameters: RestQueryParameter[] = []
    for (const parameter of operation.parameters) {
        const value: RestParameterValue | undefined = isLocaleDrivenParameter(operation, parameter) && locale != undefined
            ? locale
            : values[parameter.name]
        if (parameter.location === RestParameterLocation.Path) {
            if (isRestParameterValueSet(value)) {
                path = path.replace(`{${parameter.name}}`, encodeURIComponent(toSingleValue(parameter, value)))
            }
            continue
        }
        if (!isRestParameterValueSet(value)) {
            continue
        }
        if (typeof value === 'string') {
            queryParameters.push([parameter.name, normalize(parameter, value)])
        } else {
            for (const item of value) {
                if (item.trim().length > 0) {
                    queryParameters.push([parameter.name, normalize(parameter, item)])
                }
            }
        }
    }

    const sentBody: string | undefined = operation.hasBody && body != undefined && body.trim().length > 0
        ? body
        : undefined
    return new RestRequest(operation.method, path, ImmutableList(queryParameters), sentBody)
}

/**
 * Whether the parameter is the `{locale}` path parameter of a localized operation, which is set by the locale
 * switch.
 */
export function isLocaleDrivenParameter(operation: RestOperation, parameter: RestParameter): boolean {
    return parameter.location === RestParameterLocation.Path &&
        parameter.name === localePathParameterName &&
        operation.pathTemplate.includes(`{${localePathParameterName}}`)
}

function toSingleValue(parameter: RestParameter, value: RestParameterValue): string {
    return typeof value === 'string' ? normalize(parameter, value) : value.map(it => normalize(parameter, it)).join(',')
}

/**
 * Free text is sent exactly as written; every other kind is trimmed, because surrounding whitespace can never be
 * meant there.
 */
function normalize(parameter: RestParameter, value: string): string {
    return parameter.kind === RestParameterKind.String || parameter.kind === RestParameterKind.StringArray
        ? value
        : value.trim()
}
