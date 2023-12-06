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
    readonly value: undefined | boolean | string | number | KeywordValue | ComplexFlagValue
    /**
     * Side note of this value
     */
    readonly note?: string
    /**
     * Action to be performed when this value is clicked
     */
    readonly action?: ((item?: string) => void)

    constructor(value: undefined | boolean | string | number | KeywordValue | ComplexFlagValue, note?: string, action?: ((item?: string) => void)) {
        this.value = value
        this.note = note
        this.action = action
    }
}

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
 * Actual specific value of a property representing a multiple-state flag (not just yes/no).
 */
export class ComplexFlagValue {
    /**
     * String representation of the current state
     */
    readonly value: string
    /**
     * Description of the current state
     */
    readonly description?: string

    constructor(value: string, description?: string) {
        this.value = value
        this.description = description
    }

    toString() {
        return this.value
    }
}
