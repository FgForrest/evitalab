/**
 * Value of a REST operation parameter as edited in the form: a single string for scalar kinds (booleans as
 * `'true'` / `'false'`), a list of strings for array kinds. An unset parameter has no value at all and is never
 * sent — evitaDB rejects empty and unknown parameters.
 */
export type RestParameterValue = string | readonly string[]

/**
 * Parameter values of a request keyed by parameter name. Plain object, because it is persisted and shared as JSON.
 */
export type RestParameterValues = Readonly<Record<string, RestParameterValue>>

/**
 * Whether a value carries anything that would be sent.
 */
export function isRestParameterValueSet(value: RestParameterValue | undefined): value is RestParameterValue {
    if (value == undefined) {
        return false
    }
    if (typeof value === 'string') {
        return value.trim().length > 0
    }
    return value.length > 0
}
