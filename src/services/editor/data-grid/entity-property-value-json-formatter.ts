import { EntityPropertyValueFormatter } from '@/services/editor/data-grid/entity-property-value-formatter'
import { EntityPropertyValue } from '@/model/editor/tab/dataGrid/data-grid'

/**
 * Tries to format the value as JSON. If the value is not a valid JSON, it will throw an error.
 */
export class EntityPropertyValueJsonFormatter implements EntityPropertyValueFormatter {

    format(value: EntityPropertyValue | EntityPropertyValue[], prettyPrint: boolean = false): string {
        // validates that it's a valid JSON and parses it if needed
        const parsedJson = value instanceof Array ? value.map(it => this.parseValueIntoJson(it.value())) : this.parseValueIntoJson(value.value())
        if (prettyPrint) {
            return JSON.stringify(parsedJson, null, 2)
        } else {
            return value instanceof Array ? `[${value.map(it => it.toPreviewString()).join(', ')}]` : (value as EntityPropertyValue).toPreviewString()
        }
    }

    private parseValueIntoJson(value: any): any {
        if (value instanceof Object) {
            return value
        } else {
            return JSON.parse(typeof value === 'string' ? `"${value}"` : value.toString())
        }
    }
}
