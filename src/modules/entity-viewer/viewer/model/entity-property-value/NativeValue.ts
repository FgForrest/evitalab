import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import { BigDecimal } from '@/modules/connection/model/data-type/BigDecimal'
import { LocalDateTime } from '@/modules/connection/model/data-type/LocalDateTime'
import { Range } from '@/modules/connection/model/data-type/Range'
import { Locale } from '@/modules/connection/model/data-type/Locale'
import { OffsetDateTime } from '@/modules/connection/model/data-type/OffsetDateTime'
import { LocalDate } from '@/modules/connection/model/data-type/LocalDate'
import { LocalTime } from '@/modules/connection/model/data-type/LocalTime'
import { Predecessor } from '@/modules/connection/model/data-type/Predecessor'
import { DateTimeRange } from '@/modules/connection/model/data-type/DateTimeRange'
import { PrettyPrintable } from '@/modules/connection/model/data-type/PrettyPrintable'
import { Attributes } from '@/modules/connection/model/data/Attributes'
import { Currency } from '@/modules/connection/model/data-type/Currency'

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
    | Range<any>
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

    toPrettyPrintString(): string {
        if(typeof this.delegate === 'bigint' || typeof this.delegate === 'boolean' || typeof this.delegate === 'number' || typeof this.delegate === 'string' || typeof this.delegate === 'symbol' || typeof this.delegate === 'undefined')
            return this.delegate?.toString() ?? ''
        if (this.isPrettyPrintable(this.delegate)) {
            return (this.delegate as PrettyPrintable).getPrettyPrintableString()
        } else {
            return this.toPreviewString()
        }
    }

    toPreviewString(): string {
        if (this.delegate === undefined) {
            return this.emptyEntityPropertyValuePlaceholder
        } else if (this.delegate instanceof Array) {
            return JSON.stringify(this.delegate)
        } else if (
            this.delegate instanceof LocalDateTime ||
            this.delegate instanceof BigDecimal ||
            this.delegate instanceof Locale ||
            this.delegate instanceof Currency ||
            this.delegate instanceof OffsetDateTime ||
            this.delegate instanceof LocalDate ||
            this.delegate instanceof LocalTime ||
            this.delegate instanceof Predecessor ||
            this.delegate instanceof DateTimeRange ||
            this.delegate instanceof Attributes
        ) {
            return this.delegate.toString()
        } else if (this.delegate instanceof Object) {
            return JSON.stringify(this.delegate)
        } else {
            return this.delegate.toString()
        }
    }

    isPrettyPrintable(obj: any): obj is PrettyPrintable {
        return 'getPrettyPrintableString' in obj
    }
}
