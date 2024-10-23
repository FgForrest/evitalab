import { EntityPropertyValueFormatter } from '@/modules/entity-viewer/viewer/service/EntityPropertyValueFormatter'
import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'

/**
 * Doesn't do any formatting, just returns the value as string.
 */
export class EntityPropertyValueRawFormatter implements EntityPropertyValueFormatter {

    format(value: EntityPropertyValue | EntityPropertyValue[], prettyPrint: boolean = false): string {
        return value instanceof Array ? `[${value.map(it => it.toPreviewString()).join(', ')}]` : (value as EntityPropertyValue).toPreviewString()
    }
}
