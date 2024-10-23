/**
 * Actual specific value of a property representing a keyword (e.g., data type, enum item,...)
 */
export class KeywordValue {
    /**
     * String representation of the value
     */
    readonly value: string

    /**
     * Optional color of the keyword
     */
    readonly color?: string

    constructor(value: string, color?: string) {
        this.value = value
        this.color = color
    }

    toString() {
        return this.value
    }
}
