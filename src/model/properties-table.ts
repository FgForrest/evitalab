import { UnexpectedError } from '@/model/lab'
import { BigDecimal, DateTime, Long } from '@/model/evitadb'

/**
 * Single property of a table (row)
 */
export type Property = {
    /**
     * Name of the property
     */
    name: string
    /**
     * Value of the property
     */
    value: PropertyValue | PropertyValue[]
}

/**
 * Holder of a single value of a property
 */
export class PropertyValue {
    /**
     * Actual value of the property
     */
    readonly value: PropertyValueValue
    /**
     * Side note of this value
     */
    readonly note?: string
    /**
     * Action to be performed when this value is clicked
     */
    readonly action?: ((item?: string) => void)

    constructor(value: PropertyValueValue, note?: string, action?: ((item?: string) => void)) {
        this.value = value
        this.note = note
        this.action = action
    }
}

/**
 * Union of all supported types of property values
 */
type PropertyValueValue = undefined | boolean | string | number | KeywordValue | MultiValueFlagValue | NotApplicableValue | RangeValue

/**
 * Actual specific value of a property representing a keyword (e.g., data type, enum item,...)
 */
export class KeywordValue {
    /**
     * String representation of the value
     */
    readonly value: string

    constructor(value: string) {
        this.value = value
    }

    toString() {
        return this.value
    }
}

/**
 * Actual specific value of a property representing a multiple-state flag (not just yes/no) that should still be
 * represented by some kind of checkbox component.
 */
export class MultiValueFlagValue {
    /**
     * Boolean representation of the actual value represented by this flag. May hide the actual value, if there are multiple
     * value associated with the flag value (yes/no).
     */
    readonly value: boolean
    /**
     * String representation of the actual value represented by this flag.
     */
    readonly valueSpecification: string
    /**
     * Description of the current state
     */
    readonly description?: string

    constructor(value: boolean, valueSpecification: string, description?: string) {
        this.value = value
        this.valueSpecification = valueSpecification
        this.description = description
    }

    toString() {
        return this.valueSpecification
    }
}

/**
 * Actual specific value of a property representing a range of values (e.g., date range, number range)
 */
export class RangeValue {
    readonly offsetDateTimeFormatter = new Intl.DateTimeFormat([], { dateStyle: "medium", timeStyle: "long" })

    readonly range?: (DateTime | BigDecimal | Long | number | undefined)[]
    private serializedRange?: string[]

    constructor(range: (DateTime | BigDecimal | Long | number | undefined)[] | undefined) {
        if (range != undefined && range.length != 2) {
            throw new UnexpectedError(undefined, 'Range must have two items.')
        }
        this.range = range
    }

    toSerializable(): string[] {
        if (this.serializedRange == undefined) {
            if (this.range == undefined) {
                this.serializedRange = ['∞', '∞']
            } else {
                this.serializedRange = [this.formatPart(this.range[0]), this.formatPart(this.range[1])]
            }
        }
        return this.serializedRange
    }

    toString() {
        if (this.range == undefined) {
            return '∞ - ∞'
        }
        return `${this.formatPart(this.range[0])} - ${this.formatPart(this.range[1])}`
    }

    private formatPart(part: DateTime | BigDecimal | Long | number | undefined): string {
        if (part == undefined) {
            return '∞'
        }
        if (typeof part == 'number') {
            return part.toString()
        }
        try {
            return this.offsetDateTimeFormatter.format(new Date(part))
        } catch (e) {
            // not date time but long or BigDecimal
            return part.toString()
        }
    }
}

/**
 * Actual specific value of a property representing a value that is not applicable for the current item.
 */
export class NotApplicableValue {
    /**
     * Explanation why this value is not applicable
     */
    readonly explanation?: string

    constructor(explanation?: string) {
        this.explanation = explanation
    }

    toString() {
        return this.explanation
    }
}
