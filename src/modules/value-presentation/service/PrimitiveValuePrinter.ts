import type { ValuePrinter } from '@/modules/value-presentation/service/ValuePrinter'
import { serializeJsonWithBigInt } from '@/utils/JsonUtil'

/**
 * Prints values JavaScript represents natively: primitives by their string form, plain objects and arrays (complex
 * data) as JSON. Numbers are deliberately not localized — primary keys, codes and EANs must not get thousands
 * separators.
 */
export class PrimitiveValuePrinter<T extends string | number | bigint | boolean | object> implements ValuePrinter<T> {

    print(value: T): string {
        if (typeof value === 'object') {
            return serializeJsonWithBigInt(value)
        }
        return String(value)
    }
}
