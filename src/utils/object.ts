/**
 * Deeply merges source objects into the target object. If there is conflicts in types between two objects, error is thrown.
 *
 * @param target target object, provides base properties
 * @param source source object, which properties are merged into the target object
 */
export const deepMerge = (target: any, source: any) => {
    return deepMergeInternal([], target, source)
}

function deepMergeInternal(path: string[], target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
        const newPath = [...path, key]
        const sourceElement = source[key]
        const targetElement = target[key]

        if (Object.prototype.hasOwnProperty.call(source, key)) {
            if (sourceElement instanceof Object && targetElement instanceof Object) {
                result[key] = deepMergeInternal(newPath, targetElement, sourceElement);
            } else if (targetElement != undefined) {
                throw new Error(`Target object already contains value for key '${newPath}'.`)
            } else {
                result[key] = sourceElement;
            }
        }
    }

    return result
}
