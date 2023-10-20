import { EntityPropertyValueFormatter } from '@/services/editor/data-grid-console/entity-property-value-formatter'

/**
 * Doesn't do any formatting, just returns the value as string.
 */
export class EntityPropertyValueRawFormatter implements EntityPropertyValueFormatter {

    format(value: any, prettyPrint: boolean = false): string {
        if (value instanceof Object) {
            return JSON.stringify(value)
        } else {
            return value.toString()
        }
    }
}
