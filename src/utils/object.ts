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
                throw new Error(`Target object already contains value for key '${newPath.join('.')}'.`)
            } else {
                result[key] = sourceElement;
            }
        }
    }

    return result
}
