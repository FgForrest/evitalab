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
