import { LocalDateTime } from '@/modules/database-driver/data-type/LocalDateTime'
import { BigDecimal } from '@/modules/database-driver/data-type/BigDecimal'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { DateTimeRange } from '@/modules/database-driver/data-type/DateTimeRange'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import { BigDecimalNumberRange } from '@/modules/database-driver/data-type/BigDecimalNumberRange'
import { IntegerRange } from '@/modules/database-driver/data-type/IntegerRange'
import { BigintNumberRange } from '@/modules/database-driver/data-type/BigintNumberRange'

/**
 * Actual specific value of a property representing a range of values (e.g., date range, number range)
 */
export class RangeValue {
    readonly offsetDateTimeFormatter = new Intl.DateTimeFormat([], {
        dateStyle: 'medium',
        timeStyle: 'long',
    })

    readonly range?:
        | (LocalDateTime | BigDecimal | bigint | number | undefined)[]
        | DateTimeRange
        | BigDecimalNumberRange
        | BigintNumberRange
        | IntegerRange
    private serializedRange?: string[]

    constructor(
        range:
            | (LocalDateTime | BigDecimal | bigint | number | undefined)[]
            | DateTimeRange
            | undefined
    ) {
        if (!(range instanceof DateTimeRange)) {
            if (range != undefined && range.length != 2) {
                throw new UnexpectedError('Range must have two items.')
            }
        }
        this.range = range
    }

    toSerializable(): string[] {
        if (this.serializedRange == undefined) {
            if (this.range == undefined) {
                this.serializedRange = ['∞', '∞']
            } else if (this.range instanceof DateTimeRange) {
                const dateTimeRange = this.range as DateTimeRange
                const values = dateTimeRange.getRangeValues()
                this.serializedRange = [
                    this.formatPart(values[0]),
                    this.formatPart(values[1]),
                ]
            } else if ((this, this.range instanceof Array)) {
                this.serializedRange = [
                    this.formatPart(this.range[0]),
                    this.formatPart(this.range[1]),
                ]
            } else {
                throw new UnexpectedError('Unexpected range type')
            }
        }
        return this.serializedRange
    }

    toString() {
        if (this.range == undefined) {
            return '∞ - ∞'
        } else if (this.range instanceof Range) {
            const dateTimeRange = this.range as DateTimeRange
            const values = dateTimeRange.getRangeValues()
            return `${this.formatPart(values[0])} - ${this.formatPart(
                values[1]
            )}`
        } else if (this.range instanceof Array) {
            return `${this.formatPart(this.range[0])} - ${this.formatPart(
                this.range[1]
            )}`
        }
    }

    private formatPart(
        part:
            | OffsetDateTime
            | LocalDateTime
            | BigDecimal
            | bigint
            | number
            | undefined
    ): string {
        if (part == undefined) {
            return '∞'
        }
        if (typeof part == 'number' || typeof part == 'bigint') {
            return part.toString()
        }
        try {
            if (part instanceof LocalDateTime) {
                return this.offsetDateTimeFormatter.format(
                    new Date(part.isoDate)
                )
            }
            throw new Error('Unaccepted type')
        } catch (e) {
            // not date time but long or BigDecimal
            return part.toString()
        }
    }
}
