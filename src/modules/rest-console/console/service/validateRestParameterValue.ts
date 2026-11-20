import { RestParameter } from '@/modules/rest-console/console/model/RestParameter'
import { RestParameterKind } from '@/modules/rest-console/console/model/RestParameterKind'
import { RestParameterValidationFailure } from '@/modules/rest-console/console/model/RestParameterValidationFailure'
import {
    isRestParameterValueSet,
    type RestParameterValue,
    type RestParameterValues
} from '@/modules/rest-console/console/model/RestParameterValue'
import { RestOperation } from '@/modules/rest-console/console/model/RestOperation'
import { isLocaleDrivenParameter } from '@/modules/rest-console/console/service/buildRestRequest'

const integerPattern: RegExp = /^[+-]?\d+$/
/**
 * ISO 8601 date-time with an offset, as evitaDB expects for `date-time` parameters.
 */
const dateTimePattern: RegExp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})$/

/**
 * Validates a single parameter value against the parameter's kind. Returns `undefined` for a valid value and for
 * an optional parameter that is left unset (it is simply not sent).
 *
 * Enum values are checked only for enum kinds — the allowed locales come from the catalog schema, not from the
 * parameter.
 */
export function validateRestParameterValue(
    parameter: RestParameter,
    value: RestParameterValue | undefined
): RestParameterValidationFailure | undefined {
    if (!isRestParameterValueSet(value)) {
        return parameter.required ? RestParameterValidationFailure.Missing : undefined
    }
    const values: readonly string[] = typeof value === 'string' ? [value.trim()] : value.map(it => it.trim())
    for (const item of values) {
        const failure: RestParameterValidationFailure | undefined = validateItem(parameter, item)
        if (failure != undefined) {
            return failure
        }
    }
    return undefined
}

function validateItem(parameter: RestParameter, item: string): RestParameterValidationFailure | undefined {
    switch (parameter.kind) {
        case RestParameterKind.Boolean:
            return item === 'true' || item === 'false' ? undefined : RestParameterValidationFailure.NotBoolean
        case RestParameterKind.Integer:
            return integerPattern.test(item) ? undefined : RestParameterValidationFailure.NotInteger
        case RestParameterKind.Number:
            return item.length > 0 && Number.isFinite(Number(item)) ? undefined : RestParameterValidationFailure.NotNumber
        case RestParameterKind.DateTime:
            return dateTimePattern.test(item) ? undefined : RestParameterValidationFailure.NotDateTime
        case RestParameterKind.Enum:
        case RestParameterKind.EnumArray:
            return parameter.enumValues.includes(item) ? undefined : RestParameterValidationFailure.NotAllowedValue
        default:
            return undefined
    }
}

/**
 * Names of the parameters of an operation variant whose values cannot be sent. The `{locale}` path parameter of a
 * localized variant is driven by the locale switch: it is reported (as `locale`) only when no locale is chosen, so
 * that a literal `{locale}` is never sent.
 */
export function findInvalidRestParameters(
    operation: RestOperation,
    locale: string | undefined,
    values: RestParameterValues
): string[] {
    return operation.parameters
        .filter(parameter => isLocaleDrivenParameter(operation, parameter)
            ? locale == undefined || locale.trim().length === 0
            : validateRestParameterValue(parameter, values[parameter.name]) != undefined)
        .map(parameter => parameter.name)
        .toArray()
}
