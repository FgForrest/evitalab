import { EntityPropertyValueFormatter } from '@/services/editor/data-grid/entity-property-value-formatter'
import { EntityPropertyValue } from '@/model/editor/tab/dataGrid/data-grid'

/**
 * Doesn't do any formatting, just returns the value as string.
 */
export class EntityPropertyValueRawFormatter implements EntityPropertyValueFormatter {

    format(value: EntityPropertyValue | EntityPropertyValue[], prettyPrint: boolean = false): string {
        return value instanceof Array ? `[${value.map(it => it.toPreviewString()).join(', ')}]` : (value as EntityPropertyValue).toPreviewString()
    }
}
