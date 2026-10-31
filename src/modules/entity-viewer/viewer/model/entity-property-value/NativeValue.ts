import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import type { EvitaValue } from '@/modules/database-driver/data-type/EvitaValue'
import type { BigDecimal } from '@/modules/database-driver/data-type/BigDecimal'
import type { LocalDateTime } from '@/modules/database-driver/data-type/LocalDateTime'
import type { Range } from '@/modules/database-driver/data-type/Range'
import type { Locale } from '@/modules/database-driver/data-type/Locale'
import type { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import type { LocalDate } from '@/modules/database-driver/data-type/LocalDate'
import type { LocalTime } from '@/modules/database-driver/data-type/LocalTime'
import type { Currency } from '@/modules/database-driver/data-type/Currency'
import { serializeJsonWithBigInt } from '@/utils/JsonUtil'
import { isPlainObjectOrArray } from '@/utils/object'

/**
 * Represents a single entity property value that is a scalar (native to JavaScript). Cannot be an array, each array item
 * must be wrapped in a separate {@link NativeValue} instance.
 */
type supportedValueType =
    | string
    | LocalDateTime
    | OffsetDateTime
    | LocalDate
    | LocalTime
    | BigDecimal
    | bigint
    | number
    | object
    | boolean
    | Locale
    | Currency
    | undefined
    | Range<unknown>
export class NativeValue extends EntityPropertyValue {
    readonly delegate: supportedValueType

    constructor(delegate: supportedValueType) {
        super()
        this.delegate = delegate
    }

    value(): supportedValueType {
        return this.delegate
    }

    isEmpty(): boolean {
        return this.delegate == undefined
    }

    /**
     * Plain objects and arrays (complex data, JSON) are serialized to JSON, `bigint`-safe as a precaution. Anything
     * else, primitives and the driver's data types alike, prints its `toString()`; other non-plain objects (`Map`,
     * Immutable collections) are not supported values and would print their `toString()` too.
     */
    toPreviewString(): string {
        if (this.delegate == undefined) {
            return this.emptyEntityPropertyValuePlaceholder
        }
        if (isPlainObjectOrArray(this.delegate)) {
            return serializeJsonWithBigInt(this.delegate)
        }
        return String(this.delegate)
    }

    toRawString(): string {
        return this.toPreviewString()
    }

    toRawRepresentation(): EvitaValue {
        return this.delegate
    }
}
