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
    readonly tooltip?: string

    constructor(value: string, color?: string, tooltip?: string) {
        this.value = value
        this.color = color
        this.tooltip = tooltip
    }

    toString() {
        return this.value
    }
}
