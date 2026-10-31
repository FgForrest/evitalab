/**
 * Deeply merges source objects into the target object. If there is conflicts in types between two objects, error is thrown.
 *
 * @param target target object, provides base properties
 * @param source source object, which properties are merged into the target object
 */
export const deepMerge = (target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> => {
    return deepMergeInternal([], target, source)
}

function deepMergeInternal(path: string[], target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = { ...target };

    for (const key in source) {
        const newPath = [...path, key]
        const sourceElement = source[key]
        const targetElement = target[key]

        if (Object.prototype.hasOwnProperty.call(source, key)) {
            if (sourceElement instanceof Object && targetElement instanceof Object) {
                result[key] = deepMergeInternal(newPath, targetElement as Record<string, unknown>, sourceElement as Record<string, unknown>);
            } else if (targetElement != undefined) {
                throw new Error(`Target object already contains value for key '${newPath}'.`)
            } else {
                result[key] = sourceElement;
            }
        }
    }

    return result
}

/**
 * Returns true for plain JSON-like containers — arrays and objects created by object literals, `JSON.parse` or
 * `Object.create(null)` — as opposed to class instances, `Map`s or Immutable collections.
 */
export function isPlainObjectOrArray(value: unknown): value is object {
    if (Array.isArray(value)) {
        return true
    }
    if (value == null || typeof value !== 'object') {
        return false
    }
    const prototype: unknown = Object.getPrototypeOf(value)
    return prototype === Object.prototype || prototype === null
}
