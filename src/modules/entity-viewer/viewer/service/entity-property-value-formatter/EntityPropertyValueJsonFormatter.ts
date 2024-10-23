import { EntityPropertyValueFormatter } from '@/modules/entity-viewer/viewer/service/EntityPropertyValueFormatter'
import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'

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
        } else if(typeof value === 'string') {
            try {
                return JSON.parse(value)
            } catch(e: any){
                return JSON.parse(`"${value}"`)
            }
        } else {
            return JSON.parse(value.toString())
        }
    }
}
