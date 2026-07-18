/**
 * Builds a display title from entity attributes.
 * If there are 3 or fewer attributes, all are shown. Otherwise, only representative ones are shown.
 */
export function buildRepresentativeTitle(
    attributes: { value: unknown; isRepresentative: boolean }[],
    toPrintable: (value: unknown) => string | undefined
): string | undefined {
    if (attributes.length === 0) return undefined

    if (attributes.length <= 3) {
        return attributes.map(it => toPrintable(it.value)).join(', ')
    }
    return attributes
        .filter(it => it.isRepresentative)
        .map(it => toPrintable(it.value))
        .join(', ')
}

/**
 * Converts an attribute value to a printable string. Handles arrays, objects, and primitives.
 */
export function toPrintableAttributeValue(attributeValue: unknown): string | undefined {
    if (attributeValue == undefined) return undefined
    if (attributeValue instanceof Array) {
        if (attributeValue.length === 0) return undefined
        return `[${attributeValue.map(it => toPrintableAttributeValue(it)).join(', ')}]`
    } else if (attributeValue instanceof Object) {
        return JSON.stringify(attributeValue)
    } else {
        return String(attributeValue)
    }
}
