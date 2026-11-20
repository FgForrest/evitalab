import { buildRepresentativeTitle, toPrintableAttributeValue } from '@/modules/console/result-visualiser/service/utils/representativeTitle'
import type { RestResultNode } from '@/modules/rest-console/console/result-visualiser/model/RestResultNode'

/**
 * Builds the display title of an entity of a REST response from its attributes.
 *
 * A localized request returns the attributes flat. A non-localized one splits them into `global` and
 * `localized.<locale>`; those are merged, taking the localized attributes of the first locale returned.
 */
export function resolveRestRepresentativeTitle(
    entityResult: RestResultNode | undefined,
    representativeAttributes: string[]
): string | undefined {
    if (entityResult == undefined) {
        return undefined
    }
    const attributes: Record<string, unknown> = flattenAttributes(entityResult['attributes'])
    const possibleAttributes: { value: unknown, isRepresentative: boolean }[] = Object.entries(attributes)
        .map(([attributeName, value]) => ({
            value,
            isRepresentative: representativeAttributes.includes(attributeName)
        }))
    return buildRepresentativeTitle(possibleAttributes, toPrintableAttributeValue)
}

function flattenAttributes(attributes: unknown): Record<string, unknown> {
    if (!isObject(attributes)) {
        return {}
    }
    const global: unknown = attributes['global']
    const localized: unknown = attributes['localized']
    if (!isObject(global) && !isObject(localized)) {
        return attributes
    }
    const firstLocaleAttributes: unknown = isObject(localized) ? Object.values(localized)[0] : undefined
    return {
        ...(isObject(global) ? global : {}),
        ...(isObject(firstLocaleAttributes) ? firstLocaleAttributes : {})
    }
}

function isObject(value: unknown): value is Record<string, unknown> {
    return value != undefined && typeof value === 'object' && !Array.isArray(value)
}
