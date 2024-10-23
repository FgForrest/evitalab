/**
 * Actual specific value of a property representing a placeholder value,
 * usually some note.
 */
export class PlaceholderValue {
    /**
     * Placeholder
     */
    readonly value: string

    constructor(value: string) {
        this.value = value
    }

    toString() {
        return this.value
    }
}
