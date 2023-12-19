import { EntityPropertyValueFormatter } from '@/services/editor/data-grid/entity-property-value-formatter'

/**
 * Tries to format the value as JSON. If the value is not a valid JSON, it will throw an error.
 */
export class EntityPropertyValueJsonFormatter implements EntityPropertyValueFormatter {

    format(value: any, prettyPrint: boolean = false): string {
        // validates that it's a valid JSON and parses it if needed
        const parsedJson = this.parseValueIntoJson(value)
        if (prettyPrint) {
            return JSON.stringify(parsedJson, null, 2)
        } else {
            // we've validated that it's a valid JSON, now we need the original value
            if (value instanceof Object) {
                return JSON.stringify(value)
            } else {
                return value.toString()
            }
        }
    }

    private parseValueIntoJson(value: any): any {
        if (value instanceof Object) {
            return value
        } else {
            return JSON.parse(value.toString())
        }
    }
}
